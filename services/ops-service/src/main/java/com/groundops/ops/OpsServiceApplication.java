package com.groundops.ops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;

@EnableJms
@SpringBootApplication
public class OpsServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OpsServiceApplication.class, args);
  }
}
