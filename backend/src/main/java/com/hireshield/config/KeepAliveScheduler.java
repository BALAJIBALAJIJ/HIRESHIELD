package com.hireshield.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Self-Ping Scheduler — Prevents Render free-tier from going to sleep.
 * Pings the /api/ping endpoint every 10 seconds to keep the server alive.
 */
@Component
public class KeepAliveScheduler {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveScheduler.class);

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderUrl;

    @Value("${server.port:8080}")
    private int port;

    /**
     * Runs every 10 seconds (10000 ms).
     * Pings the server's own health endpoint to prevent sleep.
     */
    @Scheduled(fixedRate = 10000)
    public void keepAlive() {
        try {
            String pingUrl;
            if (renderUrl != null && !renderUrl.isEmpty()) {
                // Production: Use the external Render URL
                pingUrl = renderUrl + "/api/ping";
            } else {
                // Local: Ping localhost
                pingUrl = "http://localhost:" + port + "/api/ping";
            }

            HttpURLConnection connection = (HttpURLConnection) new URL(pingUrl).openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            int responseCode = connection.getResponseCode();
            connection.disconnect();

            if (responseCode == 200) {
                log.debug("Keep-alive ping successful");
            } else {
                log.warn("Keep-alive ping returned status: {}", responseCode);
            }
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
