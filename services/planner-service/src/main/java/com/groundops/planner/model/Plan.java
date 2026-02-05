package com.groundops.planner.model;

import java.time.Instant;

public class Plan {
  private final String id;
  private final String asset;
  private final Instant startTime;
  private final Instant endTime;
  private final PlanPriority priority;
  private final String notes;
  private final String createdBy;
  private final Instant createdAt;
  private PlanStatus status;
  private String approvedBy;
  private Instant approvedAt;
  private String correlationId;

  public Plan(String id, String asset, Instant startTime, Instant endTime, PlanPriority priority, String notes,
              String createdBy, Instant createdAt, String correlationId) {
    this.id = id;
    this.asset = asset;
    this.startTime = startTime;
    this.endTime = endTime;
    this.priority = priority;
    this.notes = notes;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.status = PlanStatus.DRAFT;
    this.correlationId = correlationId;
  }

  public synchronized void approve(String actor, Instant approvedAt, String correlationId) {
    this.status = PlanStatus.APPROVED;
    this.approvedBy = actor;
    this.approvedAt = approvedAt;
    this.correlationId = correlationId;
  }

  public String getId() {
    return id;
  }

  public String getAsset() {
    return asset;
  }

  public Instant getStartTime() {
    return startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public PlanPriority getPriority() {
    return priority;
  }

  public String getNotes() {
    return notes;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public PlanStatus getStatus() {
    return status;
  }

  public String getApprovedBy() {
    return approvedBy;
  }

  public Instant getApprovedAt() {
    return approvedAt;
  }

  public String getCorrelationId() {
    return correlationId;
  }
}
