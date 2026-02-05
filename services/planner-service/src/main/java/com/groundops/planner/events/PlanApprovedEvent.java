package com.groundops.planner.events;

import com.groundops.planner.model.Plan;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record PlanApprovedEvent(
    @NotBlank String eventId,
    @NotBlank String eventType,
    @NotNull Instant timestamp,
    @NotBlank String correlationId,
    @NotBlank String planId,
    @NotBlank String asset,
    @NotNull Instant windowStart,
    @NotNull Instant windowEnd,
    @NotBlank String priority,
    @NotBlank String approvedBy
) {
  public static final String TYPE = "PlanApproved.v1";

  public static PlanApprovedEvent from(Plan plan, String approvedBy, String correlationId, Instant timestamp) {
    return new PlanApprovedEvent(
        UUID.randomUUID().toString(),
        TYPE,
        timestamp,
        correlationId,
        plan.getId(),
        plan.getAsset(),
        plan.getStartTime(),
        plan.getEndTime(),
        plan.getPriority().name(),
        approvedBy
    );
  }
}
