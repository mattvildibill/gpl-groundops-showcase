package com.groundops.audit.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.groundops.audit.events.AuditEvent;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.support.converter.MappingJackson2MessageConverter;
import org.springframework.jms.support.converter.MessageConverter;
import org.springframework.jms.support.converter.MessageType;

@Configuration
public class JmsConfig {
  @Bean
  public MessageConverter jmsMessageConverter(ObjectMapper objectMapper) {
    MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
    converter.setTargetType(MessageType.TEXT);
    converter.setTypeIdPropertyName("_type");
    Map<String, Class<?>> typeIdMappings = new HashMap<>();
    typeIdMappings.put(AuditEvent.TYPE, AuditEvent.class);
    converter.setTypeIdMappings(typeIdMappings);
    converter.setObjectMapper(objectMapper);
    return converter;
  }
}
