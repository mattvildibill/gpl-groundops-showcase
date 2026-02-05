package com.groundops.planner.events;

import com.groundops.planner.model.Plan;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public record AuditEvent(
    @NotBlank String eventId,
    @NotBlank String eventType,
    @NotNull Instant timestamp,
    @NotBlank String correlationId,
    @NotBlank String actor,
    @NotBlank String action,
    @NotBlank String summary,
    @NotNull Map<String, Object> details
) {
  public static final String TYPE = "AuditEvent.v1";

  public static AuditEvent planCreated(Plan plan, String actor, String correlationId, Instant timestamp) {
    Map<String, Object> details = new LinkedHashMap<>();
    details.put("planId", plan.getId());
    details.put("asset", plan.getAsset());
    details.put("priority", plan.getPriority().name());
    details.put("windowStart", plan.getStartTime());
    details.put("windowEnd", plan.getEndTime());
    return new AuditEvent(
        UUID.randomUUID().toString(),
        TYPE,
        timestamp,
        correlationId,
        actor,
        "PLAN_CREATED",
        "Plan created for asset %s".formatted(plan.getAsset()),
        details
    );
  }

  public static AuditEvent planApproved(Plan plan, String actor, String correlationId, Instant timestamp) {
    Map<String, Object> details = new LinkedHashMap<>();
    details.put("planId", plan.getId());
    details.put("asset", plan.getAsset());
    details.put("priority", plan.getPriority().name());
    details.put("windowStart", plan.getStartTime());
    details.put("windowEnd", plan.getEndTime());
    return new AuditEvent(
        UUID.randomUUID().toString(),
        TYPE,
        timestamp,
        correlationId,
        actor,
        "PLAN_APPROVED",
        "Plan approved for asset %s".formatted(plan.getAsset()),
        details
    );
  }
}
