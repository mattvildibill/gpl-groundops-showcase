package com.groundops.planner.api;

import com.groundops.planner.api.dto.CreatePlanRequest;
import com.groundops.planner.api.dto.PlanResponse;
import com.groundops.planner.model.Plan;
import com.groundops.planner.service.PlanService;
import com.groundops.planner.support.RequestContext;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
  private final PlanService planService;

  public PlanController(PlanService planService) {
    this.planService = planService;
  }

  @PostMapping
  public PlanResponse createPlan(@Valid @RequestBody CreatePlanRequest request, Authentication authentication) {
    String actor = authentication.getName();
    String correlationId = RequestContext.correlationId();
    Plan plan = planService.createPlan(request, actor, correlationId);
    return PlanResponse.from(plan);
  }

  @PostMapping("/{planId}/approve")
  public PlanResponse approvePlan(@PathVariable("planId") String planId, Authentication authentication) {
    String actor = authentication.getName();
    String correlationId = RequestContext.correlationId();
    Plan plan = planService.approvePlan(planId, actor, correlationId);
    return PlanResponse.from(plan);
  }

  @GetMapping
  public List<PlanResponse> listPlans() {
    return planService.listPlans().stream().map(PlanResponse::from).toList();
  }

  @GetMapping("/{planId}")
  public PlanResponse getPlan(@PathVariable("planId") String planId) {
    return PlanResponse.from(planService.getPlan(planId));
  }
}
