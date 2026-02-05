package com.groundops.audit.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;

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
}
