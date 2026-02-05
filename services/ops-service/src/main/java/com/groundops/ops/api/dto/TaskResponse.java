package com.groundops.ops.api.dto;

import com.groundops.ops.model.Task;
import com.groundops.ops.model.TaskStatus;
import java.time.Instant;

public record TaskResponse(
    String id,
    String planId,
    String asset,
    Instant windowStart,
    Instant windowEnd,
    String priority,
    TaskStatus status,
    String createdBy,
    Instant createdAt,
    String correlationId
) {
  public static TaskResponse from(Task task) {
    return new TaskResponse(
        task.getId(),
        task.getPlanId(),
        task.getAsset(),
        task.getWindowStart(),
        task.getWindowEnd(),
        task.getPriority(),
        task.getStatus(),
        task.getCreatedBy(),
        task.getCreatedAt(),
        task.getCorrelationId()
    );
  }
}
