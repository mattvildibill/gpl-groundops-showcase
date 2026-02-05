package com.groundops.planner.service;

public class PlanAlreadyApprovedException extends RuntimeException {
  public PlanAlreadyApprovedException(String planId) {
    super("Plan already approved: " + planId);
  }
}
