package com.sneakerstore.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret;
    private Long expirationMinutes;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public Long getExpirationMinutes() {
        return expirationMinutes;
    }

    public void setExpirationMinutes(Long expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }
}
