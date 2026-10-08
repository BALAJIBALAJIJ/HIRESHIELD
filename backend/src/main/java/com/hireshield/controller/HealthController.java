package com.hireshield.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health check endpoint — keeps the server alive and provides status info.
 */
@RestController
public class HealthController {

    private final Instant startTime = Instant.now();

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        long uptimeSeconds = Instant.now().getEpochSecond() - startTime.getEpochSecond();
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "application", "HireShield API",
            "uptime", uptimeSeconds + "s",
            "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/api/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
