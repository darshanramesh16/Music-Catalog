package com.musiccatalog.service;

import com.musiccatalog.dto.AnalyticsDtos.Insight;
import com.musiccatalog.entity.Album;
import com.musiccatalog.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AiInsightsService {
    private final AnalyticsService analyticsService;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public AiInsightsService(
            AnalyticsService analyticsService,
            @Value("${app.ai.api-key}") String apiKey,
            @Value("${app.ai.model}") String model,
            @Value("${app.ai.base-url}") String baseUrl) {
        this.analyticsService = analyticsService;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    @SuppressWarnings("unchecked")
    public Insight generate(String email) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI insights are not configured. Set AI_API_KEY to enable them.");
        }

        List<Album> albums = analyticsService.library(email);
        if (albums.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Add albums before generating insights");
        }

        var analytics = analyticsService.analytics(email);
        double averageRating = albums.stream().map(Album::getUserRating).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average().orElse(0);
        String facts = "Total albums: " + albums.size()
                + "; top genres: " + analytics.genres().stream().limit(3).toList()
                + "; top artists: " + analytics.artists().stream().limit(3).toList()
                + "; releases by year: " + analytics.releasesByYear().stream().limit(5).toList()
                + "; average rating: " + (averageRating == 0 ? "none" : String.format("%.1f", averageRating));

        Map<String, Object> request = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "Write a concise, friendly 2-3 sentence music-library trend summary. Use only supplied facts; do not invent details."),
                        Map.of("role", "user", "content", facts)),
                "max_tokens", 160,
                "temperature", 0.5);

        try {
            Map<String, Object> response = RestClient.create(baseUrl).post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.getFirst().get("message");
            return new Insight((String) message.get("content"));
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 429) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Groq quota or rate limit reached. Wait briefly and try again.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Groq request failed. Check the API key and selected model.");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Groq request failed. Check the API configuration and try again.");
        }
    }
}
