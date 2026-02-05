package com.groundops.ops.service;

import com.groundops.ops.events.AuditEvent;
import com.groundops.ops.events.EventPublisher;
import com.groundops.ops.events.OpsTaskCreatedEvent;
import com.groundops.ops.events.PlanApprovedEvent;
import com.groundops.ops.model.Task;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class TaskService {
  private final Map<String, Task> tasks = new ConcurrentHashMap<>();
  private final Map<String, String> planIndex = new ConcurrentHashMap<>();
  private final AtomicInteger sequence = new AtomicInteger(2000);
  private final EventPublisher eventPublisher;
  private final Clock clock;

  public TaskService(EventPublisher eventPublisher, Clock clock) {
    this.eventPublisher = eventPublisher;
    this.clock = clock;
  }

  public Task createFromPlan(PlanApprovedEvent event) {
    String existing = planIndex.get(event.planId());
    if (existing != null) {
      return tasks.get(existing);
    }

    synchronized (this) {
      String recheck = planIndex.get(event.planId());
      if (recheck != null) {
        return tasks.get(recheck);
      }

      String taskId = "TSK-%04d".formatted(sequence.incrementAndGet());
      Task task = new Task(
          taskId,
          event.planId(),
          event.asset(),
          event.windowStart(),
          event.windowEnd(),
          event.priority(),
          event.approvedBy(),
          clock.instant(),
          event.correlationId()
      );
      tasks.put(taskId, task);
      planIndex.put(event.planId(), taskId);

      OpsTaskCreatedEvent opsEvent = OpsTaskCreatedEvent.from(task, event.correlationId(), clock.instant());
      eventPublisher.publishOpsTaskCreated(opsEvent, event.correlationId(), event.approvedBy());

      AuditEvent auditEvent = AuditEvent.taskCreated(task, event.approvedBy(), event.correlationId(), clock.instant());
      eventPublisher.publishAuditEvent(auditEvent, event.correlationId(), event.approvedBy());

      return task;
    }
  }

  public Task getTask(String taskId) {
    Task task = tasks.get(taskId);
    if (task == null) {
      throw new TaskNotFoundException(taskId);
    }
    return task;
  }

  public List<Task> listTasks() {
    return tasks.values().stream()
        .sorted(Comparator.comparing(Task::getCreatedAt).reversed())
        .toList();
  }
}
