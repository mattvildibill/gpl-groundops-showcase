package com.groundops.audit.service;

import com.groundops.audit.events.AuditEvent;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
  private final CopyOnWriteArrayList<AuditEvent> events = new CopyOnWriteArrayList<>();

  public void append(AuditEvent event) {
    events.add(event);
  }

  public List<AuditEvent> query(String correlationId, String actor, String action, Instant from, Instant to) {
    return events.stream()
        .filter(event -> correlationId == null || event.correlationId().equals(correlationId))
        .filter(event -> actor == null || event.actor().equalsIgnoreCase(actor))
        .filter(event -> action == null || event.action().equalsIgnoreCase(action))
        .filter(event -> from == null || !event.timestamp().isBefore(from))
        .filter(event -> to == null || !event.timestamp().isAfter(to))
        .sorted(Comparator.comparing(AuditEvent::timestamp).reversed())
        .toList();
  }
}
