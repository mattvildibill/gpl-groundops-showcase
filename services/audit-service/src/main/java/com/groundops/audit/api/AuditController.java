package com.groundops.audit.api;

import com.groundops.audit.events.AuditEvent;
import com.groundops.audit.service.AuditService;
import java.time.Instant;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @GetMapping
  public List<AuditEvent> query(
      @RequestParam(name = "correlationId", required = false) String correlationId,
      @RequestParam(name = "actor", required = false) String actor,
      @RequestParam(name = "action", required = false) String action,
      @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
      @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
  ) {
    return auditService.query(correlationId, actor, action, from, to);
  }
}
