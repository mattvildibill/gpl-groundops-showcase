package com.groundops.planner.api.error;

import com.groundops.planner.service.PlanAlreadyApprovedException;
import com.groundops.planner.service.PlanConstraintException;
import com.groundops.planner.service.PlanNotFoundException;
import com.groundops.planner.support.RequestContext;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(PlanConstraintException.class)
  public ProblemDetail handlePlanConstraint(PlanConstraintException ex) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    detail.setTitle("Plan constraint violation");
    detail.setDetail(ex.getMessage());
    detail.setProperty("errors", ex.getViolations());
    detail.setProperty("correlationId", RequestContext.correlationId());
    return detail;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    detail.setTitle("Validation failed");
    List<String> errors = ex.getBindingResult().getFieldErrors().stream()
        .map(ApiExceptionHandler::formatFieldError)
        .collect(Collectors.toList());
    detail.setProperty("errors", errors);
    detail.setProperty("correlationId", RequestContext.correlationId());
    return detail;
  }

  @ExceptionHandler(PlanNotFoundException.class)
  public ProblemDetail handleNotFound(PlanNotFoundException ex) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
    detail.setTitle("Plan not found");
    detail.setDetail(ex.getMessage());
    detail.setProperty("correlationId", RequestContext.correlationId());
    return detail;
  }

  @ExceptionHandler(PlanAlreadyApprovedException.class)
  public ProblemDetail handleAlreadyApproved(PlanAlreadyApprovedException ex) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
    detail.setTitle("Plan already approved");
    detail.setDetail(ex.getMessage());
    detail.setProperty("correlationId", RequestContext.correlationId());
    return detail;
  }

  private static String formatFieldError(FieldError error) {
    return "%s: %s".formatted(error.getField(), error.getDefaultMessage());
  }
}
