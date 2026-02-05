package com.groundops.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groundops.audit.AuditServiceApplication;
import com.groundops.ops.OpsServiceApplication;
import com.groundops.ops.events.EventDestinations;
import com.groundops.ops.events.PlanApprovedEvent;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.support.converter.MappingJackson2MessageConverter;
import org.springframework.jms.support.converter.MessageType;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.web.context.WebServerApplicationContext;
import org.testcontainers.containers.GenericContainer;

public class PlanApprovalIntegrationTest {
  private static ConfigurableApplicationContext opsContext;
  private static ConfigurableApplicationContext auditContext;

  @AfterAll
  static void tearDown() {
    if (opsContext != null) {
      opsContext.close();
    }
    if (auditContext != null) {
      auditContext.close();
    }
  }

  @Test
  void planApprovedCreatesTaskAndAuditEvent() throws Exception {
    try (GenericContainer<?> broker = new GenericContainer<>("apache/activemq-artemis:2.35.0")
        .withEnv("ARTEMIS_USER", "admin")
        .withEnv("ARTEMIS_PASSWORD", "admin")
        .withEnv("ARTEMIS_REQUIRE_LOGIN", "true")
        .withExposedPorts(61616)) {
      broker.start();

      String brokerUrl = "tcp://localhost:" + broker.getMappedPort(61616);

      opsContext = SpringApplication.run(OpsServiceApplication.class,
          "--server.port=0",
          "--spring.artemis.broker-url=" + brokerUrl,
          "--spring.artemis.user=admin",
          "--spring.artemis.password=admin",
          "--app.jwt.secret=local-dev-secret");

      auditContext = SpringApplication.run(AuditServiceApplication.class,
          "--server.port=0",
          "--spring.artemis.broker-url=" + brokerUrl,
          "--spring.artemis.user=admin",
          "--spring.artemis.password=admin",
          "--app.jwt.secret=local-dev-secret");

      int opsPort = ((WebServerApplicationContext) opsContext).getWebServer().getPort();
      int auditPort = ((WebServerApplicationContext) auditContext).getWebServer().getPort();

      JmsTemplate jmsTemplate = new JmsTemplate(new ActiveMQConnectionFactory(brokerUrl, "admin", "admin"));
      MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
      converter.setTargetType(MessageType.TEXT);
      converter.setTypeIdPropertyName("_type");
      converter.setTypeIdMappings(Map.of(PlanApprovedEvent.TYPE, PlanApprovedEvent.class));
      jmsTemplate.setMessageConverter(converter);

      String correlationId = UUID.randomUUID().toString();
      PlanApprovedEvent event = new PlanApprovedEvent(
          UUID.randomUUID().toString(),
          PlanApprovedEvent.TYPE,
          Instant.now(),
          correlationId,
          "PLN-1001",
          "AURORA-7",
          Instant.now().plusSeconds(3600),
          Instant.now().plusSeconds(7200),
          "PRIORITY",
          "demo-planner"
      );
      jmsTemplate.convertAndSend(EventDestinations.PLAN_APPROVED, event);

      RestTemplate restTemplate = new RestTemplate();
      ObjectMapper objectMapper = new ObjectMapper();

      String opsToken = mintToken("OPS");
      HttpHeaders opsHeaders = new HttpHeaders();
      opsHeaders.setBearerAuth(opsToken);
      HttpEntity<Void> opsEntity = new HttpEntity<>(opsHeaders);

      waitUntil(Duration.ofSeconds(10), Duration.ofMillis(300), () -> {
        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + opsPort + "/api/tasks",
            HttpMethod.GET,
            opsEntity,
            String.class
        );
        try {
          JsonNode root = objectMapper.readTree(response.getBody());
          return root.isArray() && root.size() > 0;
        } catch (Exception ex) {
          return false;
        }
      });

      ResponseEntity<String> tasksResponse = restTemplate.exchange(
          "http://localhost:" + opsPort + "/api/tasks",
          HttpMethod.GET,
          opsEntity,
          String.class
      );
      JsonNode tasks = objectMapper.readTree(tasksResponse.getBody());
      Assertions.assertTrue(tasks.isArray());
      Assertions.assertEquals(1, tasks.size());
      Assertions.assertEquals(correlationId, tasks.get(0).get("correlationId").asText());

      String auditToken = mintToken("AUDITOR");
      HttpHeaders auditHeaders = new HttpHeaders();
      auditHeaders.setBearerAuth(auditToken);
      HttpEntity<Void> auditEntity = new HttpEntity<>(auditHeaders);

      waitUntil(Duration.ofSeconds(10), Duration.ofMillis(300), () -> {
        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + auditPort + "/api/audit",
            HttpMethod.GET,
            auditEntity,
            String.class
        );
        try {
          JsonNode root = objectMapper.readTree(response.getBody());
          return root.isArray() && root.findValuesAsText("action").contains("OPS_TASK_CREATED");
        } catch (Exception ex) {
          return false;
        }
      });
    }
  }

  private static void waitUntil(Duration timeout, Duration interval, Supplier<Boolean> condition)
      throws InterruptedException {
    long deadline = System.currentTimeMillis() + timeout.toMillis();
    while (System.currentTimeMillis() < deadline) {
      if (condition.get()) {
        return;
      }
      Thread.sleep(interval.toMillis());
    }
    throw new AssertionError("Condition not met within " + timeout);
  }

  private static String mintToken(String role) throws Exception {
    String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    long now = System.currentTimeMillis() / 1000;
    String payloadJson = "{\"iss\":\"groundops-test\",\"sub\":\"demo-" + role.toLowerCase()
        + "\",\"roles\":[\"" + role + "\"],\"iat\":" + now + ",\"exp\":" + (now + 3600) + "}";

    String header = base64Url(headerJson.getBytes(StandardCharsets.UTF_8));
    String payload = base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));
    String unsignedToken = header + "." + payload;

    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec("local-dev-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    String signature = base64Url(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));

    return unsignedToken + "." + signature;
  }

  private static String base64Url(byte[] input) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(input);
  }
}
