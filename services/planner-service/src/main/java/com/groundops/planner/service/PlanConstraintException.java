package com.groundops.planner.service;

import java.util.List;

public class PlanConstraintException extends RuntimeException {
  private final List<ConstraintViolationDetail> violations;

  public PlanConstraintException(List<ConstraintViolationDetail> violations) {
    super("Plan violates mission planning constraints");
    this.violations = violations;
  }

  public List<ConstraintViolationDetail> getViolations() {
    return violations;
  }
}
