package com.uagrm.comedor.menu.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uagrm.comedor.menu.domain.event.DomainEvent;
import com.uagrm.comedor.menu.domain.service.EventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import java.util.List;
import java.util.Map;

@Component
public class SnsEventPublisher implements EventPublisher {
    private static final Logger log = LoggerFactory.getLogger(SnsEventPublisher.class);
    private final SnsClient sns;
    private final ObjectMapper mapper;
    private final String topicArn;

    public SnsEventPublisher(SnsClient sns, ObjectMapper mapper,
                             @Value("${aws.sns.topicDominioMenuArn}") String topicArn) {
        this.sns = sns; this.mapper = mapper; this.topicArn = topicArn;
    }

    @Override
    public void publishAll(List<DomainEvent> events) {
        for (DomainEvent e : events) {
            try {
                String json = mapper.writeValueAsString(Map.of(
                    "type", e.type(),
                    "occurredOn", e.occurredOn().toString(),
                    "payload", e
                ));
                sns.publish(PublishRequest.builder()
                    .topicArn(topicArn)
                    .message(json)
                    .build());
                log.info("[SNS] publicado {} -> {}", e.type(), topicArn);
            } catch (Exception ex) {
                log.error("[SNS] falló publicar {}: {}", e.type(), ex.getMessage());
            }
        }
    }
}
