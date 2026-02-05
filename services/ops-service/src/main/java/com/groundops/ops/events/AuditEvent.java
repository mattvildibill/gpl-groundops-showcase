package com.groundops.ops.events;

import com.groundops.ops.model.Task;
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

  public static AuditEvent taskCreated(Task task, String actor, String correlationId, Instant timestamp) {
    Map<String, Object> details = new LinkedHashMap<>();
    details.put("taskId", task.getId());
    details.put("planId", task.getPlanId());
    details.put("asset", task.getAsset());
    details.put("priority", task.getPriority());
    details.put("windowStart", task.getWindowStart());
    details.put("windowEnd", task.getWindowEnd());
    return new AuditEvent(
        UUID.randomUUID().toString(),
        TYPE,
        timestamp,
        correlationId,
        actor,
        "OPS_TASK_CREATED",
        "Ops task created for plan %s".formatted(task.getPlanId()),
        details
    );
  }
}
