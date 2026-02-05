package com.groundops.planner.api.dto;

import com.groundops.planner.model.Plan;
import com.groundops.planner.model.PlanPriority;
import com.groundops.planner.model.PlanStatus;
import java.time.Instant;

public record PlanResponse(
    String id,
    String asset,
    Instant startTime,
    Instant endTime,
    PlanPriority priority,
    String notes,
    PlanStatus status,
    String createdBy,
    Instant createdAt,
    String approvedBy,
    Instant approvedAt,
    String correlationId
) {
  public static PlanResponse from(Plan plan) {
    return new PlanResponse(
        plan.getId(),
        plan.getAsset(),
        plan.getStartTime(),
        plan.getEndTime(),
        plan.getPriority(),
        plan.getNotes(),
        plan.getStatus(),
        plan.getCreatedBy(),
        plan.getCreatedAt(),
        plan.getApprovedBy(),
        plan.getApprovedAt(),
        plan.getCorrelationId()
    );
  }
}
