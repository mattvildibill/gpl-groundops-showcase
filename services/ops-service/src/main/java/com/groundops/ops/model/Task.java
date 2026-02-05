package com.groundops.ops.model;

import java.time.Instant;

public class Task {
  private final String id;
  private final String planId;
  private final String asset;
  private final Instant windowStart;
  private final Instant windowEnd;
  private final String priority;
  private final String createdBy;
  private final Instant createdAt;
  private final String correlationId;
  private TaskStatus status;

  public Task(String id, String planId, String asset, Instant windowStart, Instant windowEnd, String priority,
              String createdBy, Instant createdAt, String correlationId) {
    this.id = id;
    this.planId = planId;
    this.asset = asset;
    this.windowStart = windowStart;
    this.windowEnd = windowEnd;
    this.priority = priority;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.correlationId = correlationId;
    this.status = TaskStatus.QUEUED;
  }

  public String getId() {
    return id;
  }

  public String getPlanId() {
    return planId;
  }

  public String getAsset() {
    return asset;
  }

  public Instant getWindowStart() {
    return windowStart;
  }

  public Instant getWindowEnd() {
    return windowEnd;
  }

  public String getPriority() {
    return priority;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public String getCorrelationId() {
    return correlationId;
  }

  public TaskStatus getStatus() {
    return status;
  }

  public void markReady() {
    this.status = TaskStatus.READY;
  }
}
