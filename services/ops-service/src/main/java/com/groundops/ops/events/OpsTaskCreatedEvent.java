package com.groundops.ops.events;

import com.groundops.ops.model.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record OpsTaskCreatedEvent(
    @NotBlank String eventId,
    @NotBlank String eventType,
    @NotNull Instant timestamp,
    @NotBlank String correlationId,
    @NotBlank String taskId,
    @NotBlank String planId,
    @NotBlank String asset,
    @NotNull Instant windowStart,
    @NotNull Instant windowEnd,
    @NotBlank String priority,
    @NotBlank String createdBy
) {
  public static final String TYPE = "OpsTaskCreated.v1";

  public static OpsTaskCreatedEvent from(Task task, String correlationId, Instant timestamp) {
    return new OpsTaskCreatedEvent(
        UUID.randomUUID().toString(),
        TYPE,
        timestamp,
        correlationId,
        task.getId(),
        task.getPlanId(),
        task.getAsset(),
        task.getWindowStart(),
        task.getWindowEnd(),
        task.getPriority(),
        task.getCreatedBy()
    );
  }
}
