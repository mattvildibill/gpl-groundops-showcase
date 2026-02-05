package com.groundops.audit.events;

import com.groundops.audit.service.AuditService;
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
public class AuditEventListener {
  private static final Logger log = LoggerFactory.getLogger(AuditEventListener.class);
  private final AuditService auditService;
  private final Validator validator;

  public AuditEventListener(AuditService auditService, Validator validator) {
    this.auditService = auditService;
    this.validator = validator;
  }

  @JmsListener(destination = EventDestinations.AUDIT_EVENTS)
  public void onAuditEvent(AuditEvent event) {
    setMdc(event.correlationId(), event.actor());
    try {
      if (!isValid(event)) {
        return;
      }
      auditService.append(event);
    } finally {
      clearMdc();
    }
  }

  private boolean isValid(AuditEvent event) {
    Set<ConstraintViolation<AuditEvent>> violations = validator.validate(event);
    if (!violations.isEmpty()) {
      String details = violations.stream()
          .map(v -> v.getPropertyPath() + " " + v.getMessage())
          .collect(Collectors.joining(", "));
      log.warn("Invalid AuditEvent: {}", details);
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
