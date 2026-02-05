package com.groundops.planner.service;

public class PlanNotFoundException extends RuntimeException {
  public PlanNotFoundException(String planId) {
    super("Plan not found: " + planId);
  }
}
