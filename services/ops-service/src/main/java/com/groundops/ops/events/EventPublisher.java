package com.groundops.ops.events;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventPublisher {
  private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);
  private final JmsTemplate jmsTemplate;
  private final Validator validator;

  public EventPublisher(JmsTemplate jmsTemplate, Validator validator) {
    this.jmsTemplate = jmsTemplate;
    this.validator = validator;
  }

  public void publishOpsTaskCreated(OpsTaskCreatedEvent event, String correlationId, String actor) {
    validate(event);
    send(EventDestinations.OPS_TASK_CREATED, event, correlationId, actor);
  }

  public void publishAuditEvent(AuditEvent event, String correlationId, String actor) {
    validate(event);
    send(EventDestinations.AUDIT_EVENTS, event, correlationId, actor);
  }

  private void send(String destination, Object payload, String correlationId, String actor) {
    log.info("Publishing event to {}", destination);
    jmsTemplate.convertAndSend(destination, payload, message -> {
      message.setStringProperty("correlationId", correlationId);
      message.setStringProperty("actor", actor);
      return message;
    });
  }

  private void validate(Object event) {
    Set<ConstraintViolation<Object>> violations = validator.validate(event);
    if (!violations.isEmpty()) {
      String details = violations.stream()
          .map(v -> v.getPropertyPath() + " " + v.getMessage())
          .collect(Collectors.joining(", "));
      throw new IllegalArgumentException("Invalid event payload: " + details);
    }
  }
}
