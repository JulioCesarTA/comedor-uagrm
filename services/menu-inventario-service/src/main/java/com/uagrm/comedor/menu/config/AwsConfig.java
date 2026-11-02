package com.uagrm.comedor.menu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

@Configuration
public class AwsConfig {
    @Value("${aws.region}") String region;
    @Value("${aws.endpoint:}") String endpoint;
    @Value("${AWS_ACCESS_KEY_ID:test}") String ak;
    @Value("${AWS_SECRET_ACCESS_KEY:test}") String sk;

    @Bean
    SnsClient snsClient() {
        var b = SnsClient.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk)));
        if (endpoint != null && !endpoint.isBlank()) b.endpointOverride(URI.create(endpoint));
        return b.build();
    }

    @Bean
    SqsClient sqsClient() {
        var b = SqsClient.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk)));
        if (endpoint != null && !endpoint.isBlank()) b.endpointOverride(URI.create(endpoint));
        return b.build();
    }
}
