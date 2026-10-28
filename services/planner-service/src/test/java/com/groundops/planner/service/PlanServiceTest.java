package com.groundops.planner.service;

import com.groundops.planner.api.dto.CreatePlanRequest;
import com.groundops.planner.events.EventPublisher;
import com.groundops.planner.model.PlanPriority;
import com.groundops.planner.model.PlanStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PlanServiceTest {
  private final EventPublisher publisher = mock(EventPublisher.class);
  private final Instant now = Instant.parse("2026-01-01T00:00:00Z");
  private final PlanService service = new PlanService(publisher, Clock.fixed(now, ZoneOffset.UTC));

  private String draft() {
    return service.createPlan(new CreatePlanRequest("AURORA-7", now.plusSeconds(3600),
        now.plusSeconds(7200), PlanPriority.ROUTINE, "Synthetic test"), "planner", "create-trace").getId();
  }

  @Test
  void failedPublicationLeavesDraftRetryable() {
    String id = draft();
    doThrow(new IllegalStateException("broker unavailable")).doNothing()
        .when(publisher).publishPlanApproved(any(), anyString(), anyString());
    assertThrows(IllegalStateException.class, () -> service.approvePlan(id, "planner", "first"));
    assertEquals(PlanStatus.DRAFT, service.getPlan(id).getStatus());
    assertEquals(PlanStatus.APPROVED, service.approvePlan(id, "planner", "retry").getStatus());
  }

  @Test
  void auditFailureDoesNotPermanentlyBlockApprovalRetry() {
    String id = draft();
    doThrow(new IllegalStateException("audit send failed")).doNothing()
        .when(publisher).publishAuditEvent(any(), anyString(), anyString());
    assertThrows(IllegalStateException.class, () -> service.approvePlan(id, "planner", "first"));
    assertEquals(PlanStatus.DRAFT, service.getPlan(id).getStatus());
    service.approvePlan(id, "planner", "retry");
    assertEquals(PlanStatus.APPROVED, service.getPlan(id).getStatus());
  }

  @Test
  void concurrentApprovalsPublishOnce() throws Exception {
    String id = draft();
    CountDownLatch start = new CountDownLatch(1);
    try (var workers = Executors.newFixedThreadPool(2)) {
      var first = workers.submit(() -> attemptApproval(id, start));
      var second = workers.submit(() -> attemptApproval(id, start));
      start.countDown();
      int successes = (first.get(5, TimeUnit.SECONDS) ? 1 : 0)
          + (second.get(5, TimeUnit.SECONDS) ? 1 : 0);
      assertEquals(1, successes);
    }
    verify(publisher, times(1)).publishPlanApproved(any(), anyString(), anyString());
  }

  private boolean attemptApproval(String id, CountDownLatch start) throws InterruptedException {
    start.await();
    try {
      service.approvePlan(id, "planner", "trace");
      return true;
    } catch (PlanAlreadyApprovedException expected) {
      return false;
    }
  }
}
