package com.groundops.planner.support;

import org.slf4j.MDC;

public final class RequestContext {
  private RequestContext() {}

  public static String correlationId() {
    return MDC.get("correlationId");
  }
}
