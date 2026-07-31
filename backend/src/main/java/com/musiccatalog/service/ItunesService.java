package com.musiccatalog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.musiccatalog.dto.AlbumDtos.SearchAlbum;
import com.musiccatalog.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Service
public class ItunesService {
    private final RestClient client = RestClient.create("https://itunes.apple.com");
    private final ObjectMapper objectMapper;

    public ItunesService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<SearchAlbum> search(String query, String entity) {
        if (query == null || query.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Search query is required");
        }

        try {
            // Apple returns JSON with a text/javascript content type, so read it as text first.
            String rawResponse = client.get()
                    .uri(uri -> uri.path("/search")
                            .queryParam("term", query.trim())
                            .queryParam("entity", entity)
                            .queryParam("limit", 20)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> body = objectMapper.readValue(rawResponse, new TypeReference<>() {});
            Object resultValue = body.get("results");
            if (!(resultValue instanceof List<?> results)) {
                return List.of();
            }

            return results.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .filter(item -> item.get("collectionId") instanceof Number)
                    .map(item -> new SearchAlbum(
                            ((Number) item.get("collectionId")).longValue(),
                            (String) item.get("collectionName"),
                            (String) item.get("artistName"),
                            (String) item.get("primaryGenreName"),
                            parseDate((String) item.get("releaseDate")),
                            number(item.get("trackCount")),
                            (String) item.get("artworkUrl100")))
                    .toList();
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Unable to reach the iTunes catalog");
        }
    }

    private LocalDate parseDate(String value) {
        try {
            return value == null ? null : Instant.parse(value).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (Exception ignored) {
            return null;
        }
    }

    private Integer number(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }
}
