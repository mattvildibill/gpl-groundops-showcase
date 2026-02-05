package com.groundops.ops.events;

import com.groundops.ops.service.TaskService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
public class PlanApprovedListener {
  private static final Logger log = LoggerFactory.getLogger(PlanApprovedListener.class);
  private final TaskService taskService;
  private final Validator validator;

  public PlanApprovedListener(TaskService taskService, Validator validator) {
    this.taskService = taskService;
    this.validator = validator;
  }

  @JmsListener(destination = EventDestinations.PLAN_APPROVED)
  public void onPlanApproved(PlanApprovedEvent event) {
    setMdc(event.correlationId(), event.approvedBy());
    try {
      if (!isValid(event)) {
        return;
      }
      taskService.createFromPlan(event);
    } finally {
      clearMdc();
    }
  }

  private boolean isValid(PlanApprovedEvent event) {
    Set<ConstraintViolation<PlanApprovedEvent>> violations = validator.validate(event);
    if (!violations.isEmpty()) {
      String details = violations.stream()
          .map(v -> v.getPropertyPath() + " " + v.getMessage())
          .collect(Collectors.joining(", "));
      log.warn("Invalid PlanApproved event: {}", details);
      return false;
    }
    return true;
  }

  private void setMdc(String correlationId, String actor) {
    MDC.put("correlationId", correlationId);
    MDC.put("actor", actor);
  }

  private void clearMdc() {
    MDC.remove("correlationId");
    MDC.remove("actor");
  }
}
