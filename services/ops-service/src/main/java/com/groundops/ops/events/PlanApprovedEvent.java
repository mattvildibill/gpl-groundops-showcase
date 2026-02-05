package com.groundops.ops.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

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
}
