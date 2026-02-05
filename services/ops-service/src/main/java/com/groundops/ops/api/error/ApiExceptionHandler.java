package com.groundops.ops.api.error;

import com.groundops.ops.service.TaskNotFoundException;
import com.groundops.ops.support.RequestContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(TaskNotFoundException.class)
  public ProblemDetail handleNotFound(TaskNotFoundException ex) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
    detail.setTitle("Task not found");
    detail.setDetail(ex.getMessage());
    detail.setProperty("correlationId", RequestContext.correlationId());
    return detail;
  }
}
