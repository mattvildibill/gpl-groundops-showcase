package com.groundops.planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;

@EnableJms
@SpringBootApplication
public class PlannerServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(PlannerServiceApplication.class, args);
  }
}
