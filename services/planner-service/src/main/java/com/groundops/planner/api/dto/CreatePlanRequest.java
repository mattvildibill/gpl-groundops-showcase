package com.groundops.planner.api.dto;

import com.groundops.planner.model.PlanPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreatePlanRequest(
    @NotBlank String asset,
    @NotNull Instant startTime,
    @NotNull Instant endTime,
    @NotNull PlanPriority priority,
    @Size(max = 500) String notes
) {}
