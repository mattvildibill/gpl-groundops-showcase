package com.groundops.planner.service;

import com.groundops.planner.api.dto.CreatePlanRequest;
import com.groundops.planner.events.AuditEvent;
import com.groundops.planner.events.EventPublisher;
import com.groundops.planner.events.PlanApprovedEvent;
import com.groundops.planner.model.Plan;
import com.groundops.planner.model.PlanStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class PlanService {
  private final Map<String, Plan> plans = new ConcurrentHashMap<>();
  private final AtomicInteger sequence = new AtomicInteger(1000);
  private final PlanConstraints constraints = new PlanConstraints();
  private final EventPublisher eventPublisher;
  private final Clock clock;

  public PlanService(EventPublisher eventPublisher, Clock clock) {
    this.eventPublisher = eventPublisher;
    this.clock = clock;
  }

  public Plan createPlan(CreatePlanRequest request, String actor, String correlationId) {
    List<ConstraintViolationDetail> violations = constraints.validate(request, clock.instant());
    if (!violations.isEmpty()) {
      throw new PlanConstraintException(violations);
    }

    String id = "PLN-%04d".formatted(sequence.incrementAndGet());
    Plan plan = new Plan(id, request.asset(), request.startTime(), request.endTime(), request.priority(),
        request.notes(), actor, clock.instant(), correlationId);
    plans.put(id, plan);

    AuditEvent auditEvent = AuditEvent.planCreated(plan, actor, correlationId, clock.instant());
    eventPublisher.publishAuditEvent(auditEvent, correlationId, actor);

    return plan;
  }

  public Plan approvePlan(String planId, String actor, String correlationId) {
    Plan plan = plans.get(planId);
    if (plan == null) {
      throw new PlanNotFoundException(planId);
    }
    if (plan.getStatus() == PlanStatus.APPROVED) {
      throw new PlanAlreadyApprovedException(planId);
    }
    if (plan.getStartTime().isBefore(clock.instant())) {
      throw new PlanConstraintException(List.of(new ConstraintViolationDetail(
          "WINDOW_IN_PAST",
          "Plan window already started. Update the window before approval."
      )));
    }

    plan.approve(actor, clock.instant(), correlationId);

    PlanApprovedEvent approvedEvent = PlanApprovedEvent.from(plan, actor, correlationId, clock.instant());
    eventPublisher.publishPlanApproved(approvedEvent, correlationId, actor);

    AuditEvent auditEvent = AuditEvent.planApproved(plan, actor, correlationId, clock.instant());
    eventPublisher.publishAuditEvent(auditEvent, correlationId, actor);

    return plan;
  }

  public Plan getPlan(String planId) {
    Plan plan = plans.get(planId);
    if (plan == null) {
      throw new PlanNotFoundException(planId);
    }
    return plan;
  }

  public List<Plan> listPlans() {
    return plans.values().stream()
        .sorted(Comparator.comparing(Plan::getCreatedAt).reversed())
        .toList();
  }
}
