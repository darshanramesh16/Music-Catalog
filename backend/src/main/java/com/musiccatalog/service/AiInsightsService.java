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
import java.util.stream.Collectors;

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
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI insights are not configured. Set AI_API_KEY to enable them.");
        }

        List<Album> albums = analyticsService.library(email);
        if (albums.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Add albums before generating insights");
        }

        var analytics = analyticsService.analytics(email);
        int ratedCount = (int) albums.stream().filter(a -> a.getUserRating() != null).count();
        double averageRating = ratedCount == 0 ? 0
                : albums.stream().filter(a -> a.getUserRating() != null)
                        .mapToInt(Album::getUserRating).average().orElse(0);

        String topGenres = analytics.genres().stream()
                .limit(5)
                .map(g -> g.name() + " (" + g.count() + ")")
                .collect(Collectors.joining(", ", "", ""));
        String topArtists = analytics.artists().stream()
                .limit(5)
                .map(a -> a.name() + " (" + a.count() + ")")
                .collect(Collectors.joining(", ", "", ""));
        String releasesByYear = analytics.releasesByYear().stream()
                .limit(6)
                .map(r -> r.name() + " (" + r.count() + ")")
                .collect(Collectors.joining(", ", "", ""));
        String trackDistribution = analytics.trackDistribution().stream()
                .map(d -> d.name() + " (" + d.count() + ")")
                .collect(Collectors.joining(", ", "", ""));
        String ratingSummary = ratedCount == 0
                ? "no user ratings are available"
                : "" + ratedCount + " rated albums with an average rating of " + String.format("%.1f", averageRating);

        String facts = "Total albums: " + albums.size()
                + ". Genre distribution: " + topGenres
                + ". Top artists: " + topArtists
                + ". Releases by year: " + releasesByYear
                + ". Track count distribution: " + trackDistribution
                + ". Rating data: " + ratingSummary + ".";

        Map<String, Object> request = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content",
                                "Return exactly 5 analytical bullet points about this saved music collection. Use only the supplied facts and do not invent any details. Each bullet must start with '•', be a full sentence, be between 25 and 45 words long, and focus on a distinct trend. Do not include any introductory or closing sentences outside the bullets. The response should be approximately 150 to 250 words in total. Use rich analysis across genres, artists, release years, track counts, and ratings."),
                        Map.of("role", "user", "content", facts)),
                "max_tokens", 420,
                "temperature", 0.2);

        try {
            Map<String, Object> response = RestClient.create(baseUrl).post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return new Insight((String) message.get("content"));
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 429) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Groq quota or rate limit reached. Wait briefly and try again.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Groq request failed. Check the API key and selected model.");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Groq request failed. Check the API configuration and try again.");
        }
    }
}
