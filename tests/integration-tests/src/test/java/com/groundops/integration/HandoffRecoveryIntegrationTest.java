package com.groundops.integration;

import com.groundops.planner.PlannerServiceApplication;
import com.groundops.ops.OpsServiceApplication;
import com.groundops.audit.AuditServiceApplication;
import com.groundops.planner.api.dto.CreatePlanRequest;
import com.groundops.planner.model.PlanPriority;
import com.groundops.planner.model.PlanStatus;
import com.groundops.planner.service.PlanService;
import com.groundops.ops.service.TaskService;
import com.groundops.ops.events.PlanApprovedEvent;
import com.groundops.ops.events.EventDestinations;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.*;
import org.springframework.jms.config.JmsListenerEndpointRegistry;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.GenericContainer;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class HandoffRecoveryIntegrationTest {
  private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();
  private final RestTemplate http = new RestTemplate();

  @Test
  void approvedWindowWaitsForConsumerThenRecoversAndIgnoresDuplicateMessages() throws Exception {
    try (var fixture = new Fixture()) {
      var registry = fixture.ops.getBean(JmsListenerEndpointRegistry.class);
      registry.stop();
      var draft = post(fixture.planner, "/api/plans", new CreatePlanRequest("AURORA-7",
          Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), PlanPriority.PRIORITY,
          "Synthetic coastal survey"), "draft-trace");
      String planId = draft.get("id").asText();
      var approved = post(fixture.planner, "/api/plans/" + planId + "/approve", null, "approval-trace");
      assertEquals("APPROVED", approved.get("status").asText());
      assertTrue(fixture.ops.getBean(TaskService.class).listTasks().isEmpty());
      // Browse the actual broker queue: pending is positive evidence, not just a sleep.
      var producer = fixture.planner.getBean(JmsTemplate.class);
      var second = post(fixture.planner, "/api/plans", new CreatePlanRequest("AURORA-8",
          Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), PlanPriority.ROUTINE,
          "Second queued window"), "second-draft");
      post(fixture.planner, "/api/plans/" + second.get("id").asText() + "/approve", null, "second-approval");
      assertEquals(2, queued(producer));
      assertTrue(fixture.ops.getBean(TaskService.class).listTasks().isEmpty());
      registry.start();
      await(() -> fixture.ops.getBean(TaskService.class).listTasks().size() == 2);
      var task = fixture.ops.getBean(TaskService.class).listTasks().stream()
          .filter(t -> t.getPlanId().equals(planId)).findFirst().orElseThrow();
      assertEquals(planId, task.getPlanId());
      assertEquals("approval-trace", task.getCorrelationId());
      assertEquals(approved.get("startTime").asText(), task.getWindowStart().toString());
      await(() -> auditCount(fixture, "OPS_TASK_CREATED", "approval-trace") == 1);
      assertEquals(1, auditCount(fixture, "PLAN_APPROVED", "approval-trace"));
      assertEquals(1, auditCount(fixture, "PLAN_CREATED", "draft-trace"));

      var event = new PlanApprovedEvent(UUID.randomUUID().toString(), PlanApprovedEvent.TYPE,
          Instant.now(), "approval-trace", planId, task.getAsset(), task.getWindowStart(),
          task.getWindowEnd(), task.getPriority(), "demo-planner");
      var opsProducer = fixture.ops.getBean(JmsTemplate.class);
      // Same event delivered twice, followed by a barrier event on the same ordered listener.
      opsProducer.convertAndSend(EventDestinations.PLAN_APPROVED, event);
      opsProducer.convertAndSend(EventDestinations.PLAN_APPROVED, event);
      opsProducer.convertAndSend(EventDestinations.PLAN_APPROVED, new PlanApprovedEvent(
          UUID.randomUUID().toString(), PlanApprovedEvent.TYPE, Instant.now(), "barrier-trace",
          "PLN-BARRIER", "TEST", task.getWindowStart(), task.getWindowEnd(), "ROUTINE", "demo-planner"));
      await(() -> auditCount(fixture, "OPS_TASK_CREATED", "barrier-trace") == 1);
      assertEquals(1, fixture.ops.getBean(TaskService.class).listTasks().stream()
          .filter(t -> t.getPlanId().equals(planId)).count());
      assertEquals(1, auditCount(fixture, "OPS_TASK_CREATED", "approval-trace"));
      assertEquals(0, queued(producer));
    }
  }

  @Test
  void secondSendFailureRollsBackApprovalPairAndAllowsRetry() throws Exception {
    try (var fixture = new Fixture()) {
      fixture.ops.getBean(JmsListenerEndpointRegistry.class).stop();
      var template = fixture.planner.getBean(JmsTemplate.class);
      var publisher = spy(new com.groundops.planner.events.EventPublisher(template,
          fixture.planner.getBean(Validator.class)));
      var service = new PlanService(publisher, Clock.systemUTC());
      String id = service.createPlan(new CreatePlanRequest("TEST", Instant.now().plusSeconds(3600),
          Instant.now().plusSeconds(7200), PlanPriority.ROUTINE, "Synthetic test"), "planner", "create").getId();
      doThrow(new IllegalStateException("controlled second-send failure")).doCallRealMethod()
          .when(publisher).publishAuditEvent(any(), anyString(), anyString());
      assertThrows(IllegalStateException.class, () -> service.approvePlan(id, "planner", "failed"));
      assertEquals(PlanStatus.DRAFT, service.getPlan(id).getStatus());
      assertEquals(0, queued(template));
      service.approvePlan(id, "planner", "recovered");
      assertEquals(1, queued(template));
      fixture.ops.getBean(JmsListenerEndpointRegistry.class).start();
      await(() -> auditCount(fixture, "OPS_TASK_CREATED", "recovered") == 1);
      assertEquals(0, auditCount(fixture, "PLAN_APPROVED", "failed"));
    }
  }

  @Test
  void failedTaskEvidenceDoesNotPoisonDeduplication() throws Exception {
    try (var fixture = new Fixture()) {
      var template = fixture.ops.getBean(JmsTemplate.class);
      var publisher = spy(new com.groundops.ops.events.EventPublisher(template,
          fixture.ops.getBean(Validator.class)));
      var service = new TaskService(publisher, Clock.systemUTC());
      var event = new PlanApprovedEvent(UUID.randomUUID().toString(), PlanApprovedEvent.TYPE,
          Instant.now(), "task-retry", "PLN-RETRY", "TEST", Instant.now().plusSeconds(3600),
          Instant.now().plusSeconds(7200), "ROUTINE", "planner");
      doThrow(new IllegalStateException("controlled second-send failure")).doCallRealMethod()
          .when(publisher).publishAuditEvent(any(), anyString(), anyString());
      assertThrows(IllegalStateException.class, () -> service.createFromPlan(event));
      assertTrue(service.listTasks().isEmpty());
      template.setReceiveTimeout(300);
      assertNull(template.receive(EventDestinations.OPS_TASK_CREATED));
      var task = service.createFromPlan(event);
      assertSame(task, service.createFromPlan(event));
      assertEquals(1, service.listTasks().size());
      assertNotNull(template.receive(EventDestinations.OPS_TASK_CREATED));
      assertNull(template.receive(EventDestinations.OPS_TASK_CREATED));
      await(() -> auditCount(fixture, "OPS_TASK_CREATED", "task-retry") == 1);
    }
  }

  private JsonNode post(ConfigurableApplicationContext context, String path, Object body, String trace) throws Exception {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(PlanApprovalIntegrationTest.mintToken("PLANNER"));
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("X-Correlation-Id", trace);
    return json.readTree(http.postForObject(url(context) + path, new HttpEntity<>(body, headers), String.class));
  }
  private int auditCount(Fixture f, String action, String trace) {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(PlanApprovalIntegrationTest.mintToken("AUDITOR"));
      return json.readTree(http.exchange(url(f.audit) + "/api/audit?action=" + action + "&correlationId=" + trace,
          HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody()).size();
    } catch (Exception e) { throw new RuntimeException(e); }
  }
  private static String url(ConfigurableApplicationContext context) {
    return "http://localhost:" + ((WebServerApplicationContext) context).getWebServer().getPort();
  }
  private static int queued(JmsTemplate template) {
    return template.browse(EventDestinations.PLAN_APPROVED, (session, browser) -> {
      int count = 0; var messages = browser.getEnumeration();
      while (messages.hasMoreElements()) { messages.nextElement(); count++; }
      return count;
    });
  }
  private static void await(java.util.function.BooleanSupplier condition) throws InterruptedException {
    long end = System.nanoTime() + java.time.Duration.ofSeconds(15).toNanos();
    while (!condition.getAsBoolean()) {
      if (System.nanoTime() > end) fail("Timed out waiting for handoff evidence");
      Thread.sleep(100);
    }
  }
  private static class Fixture implements AutoCloseable {
    final GenericContainer<?> broker = new GenericContainer<>("apache/activemq-artemis:2.35.0")
        .withEnv("ARTEMIS_USER", "admin").withEnv("ARTEMIS_PASSWORD", "admin")
        .withEnv("ARTEMIS_REQUIRE_LOGIN", "true").withExposedPorts(61616);
    ConfigurableApplicationContext planner, ops, audit;
    Fixture() {
      try {
        broker.start();
        planner = start(PlannerServiceApplication.class);
        ops = start(OpsServiceApplication.class);
        audit = start(AuditServiceApplication.class);
      } catch (RuntimeException e) { close(); throw e; }
    }
    private ConfigurableApplicationContext start(Class<?> app) {
      return SpringApplication.run(app, "--server.port=0", "--spring.artemis.broker-url=tcp://localhost:" + broker.getMappedPort(61616),
          "--spring.artemis.user=admin", "--spring.artemis.password=admin", "--app.jwt.secret=local-dev-secret-32-bytes-minimum!");
    }
    public void close() {
      if (planner != null) planner.close();
      if (ops != null) ops.close();
      if (audit != null) audit.close();
      broker.close();
    }
  }
}
