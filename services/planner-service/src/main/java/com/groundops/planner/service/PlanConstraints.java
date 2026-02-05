package com.groundops.planner.service;

import com.groundops.planner.api.dto.CreatePlanRequest;
import com.groundops.planner.model.PlanPriority;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

public class PlanConstraints {
  private static final Duration MIN_DURATION = Duration.ofMinutes(30);
  private static final Duration MAX_DURATION = Duration.ofHours(6);
  private static final long MAX_START_DAYS = 14;

  public List<ConstraintViolationDetail> validate(CreatePlanRequest request, Instant now) {
    List<ConstraintViolationDetail> violations = new ArrayList<>();

    if (request.startTime().isBefore(now)) {
      violations.add(new ConstraintViolationDetail(
          "WINDOW_IN_PAST",
          "Start time must be in the future."
      ));
    }

    if (request.startTime().isAfter(now.plus(MAX_START_DAYS, ChronoUnit.DAYS))) {
      violations.add(new ConstraintViolationDetail(
          "WINDOW_TOO_FAR",
          "Start time must be within the next %d days.".formatted(MAX_START_DAYS)
      ));
    }

    if (!request.endTime().isAfter(request.startTime())) {
      violations.add(new ConstraintViolationDetail(
          "WINDOW_ORDER",
          "End time must be after start time."
      ));
    } else {
      Duration duration = Duration.between(request.startTime(), request.endTime());
      if (duration.compareTo(MIN_DURATION) < 0 || duration.compareTo(MAX_DURATION) > 0) {
        violations.add(new ConstraintViolationDetail(
            "WINDOW_DURATION",
            "Window duration must be between 30 minutes and 6 hours."
        ));
      }
    }

    if (request.priority() == PlanPriority.CRITICAL) {
      String notes = request.notes() == null ? "" : request.notes().trim();
      if (notes.length() < 20) {
        violations.add(new ConstraintViolationDetail(
            "CRITICAL_NOTES",
            "Critical plans require notes of at least 20 characters."
        ));
      }
    }

    return violations;
  }
}
