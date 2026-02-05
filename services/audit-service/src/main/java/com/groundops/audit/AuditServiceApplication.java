package com.groundops.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;

@EnableJms
@SpringBootApplication
public class AuditServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(AuditServiceApplication.class, args);
  }
}
