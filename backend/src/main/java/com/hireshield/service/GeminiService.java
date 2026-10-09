package com.hireshield.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service to communicate with Google Gemini 3.8 Flash.
 * All AI processing happens here — never exposed to frontend.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Send a prompt to Gemini and get structured JSON response.
     */
    public Map<String, Object> analyzeWithGemini(String prompt) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("GEMINI_API_KEY not configured — falling back to heuristic screening");
            return null;
        }

        try {
            String url = GEMINI_URL + "?key=" + apiKey;

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                    "temperature", 0.1,
                    "topP", 0.95,
                    "maxOutputTokens", 8192,
                    "responseMimeType", "application/json"
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody());
            }

            log.error("Gemini API returned non-200: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Analyze a resume document with Gemini using base64 content.
     */
    public Map<String, Object> analyzeResumeWithGemini(String resumeBase64, String mimeType, String prompt) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("GEMINI_API_KEY not configured — falling back to heuristic screening");
            return null;
        }

        try {
            String url = GEMINI_URL + "?key=" + apiKey;

            List<Map<String, Object>> parts = new ArrayList<>();
            // Add the document
            parts.add(Map.of("inlineData", Map.of("mimeType", mimeType, "data", resumeBase64)));
            // Add the text prompt
            parts.add(Map.of("text", prompt));

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of(
                    "temperature", 0.1,
                    "topP", 0.95,
                    "maxOutputTokens", 8192,
                    "responseMimeType", "application/json"
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody());
            }

            log.error("Gemini API returned non-200 for resume analysis: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("Gemini resume analysis failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseGeminiResponse(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode content = candidates.get(0).path("content").path("parts");
            if (content.isArray() && content.size() > 0) {
                String text = content.get(0).path("text").asText();
                // Clean potential markdown code fences
                text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
                try {
                    return objectMapper.readValue(text, Map.class);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to parse Gemini JSON, returning raw text: {}", text.substring(0, Math.min(200, text.length())));
                    return Map.of("rawResponse", text);
                }
            }
        }
        return null;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isEmpty();
    }
}
