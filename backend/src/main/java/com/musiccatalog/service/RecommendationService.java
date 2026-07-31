package com.musiccatalog.service;

import com.musiccatalog.dto.AlbumDtos.Recommendation;
import com.musiccatalog.dto.AlbumDtos.SearchAlbum;
import com.musiccatalog.entity.Album;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final AnalyticsService analyticsService;
    private final ItunesService itunesService;

    public RecommendationService(AnalyticsService analyticsService, ItunesService itunesService) {
        this.analyticsService = analyticsService;
        this.itunesService = itunesService;
    }

    public List<Recommendation> recommendations(String email) {
        List<Album> library = analyticsService.library(email);
        if (library.isEmpty()) {
            return List.of();
        }

        Set<Long> savedCatalogIds = library.stream().map(Album::getAppleCatalogId).collect(Collectors.toSet());
        List<String> preferredGenres = library.stream()
                .map(Album::getGenre)
                .filter(genre -> genre != null && !genre.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .limit(2)
                .toList();

        Map<Long, Recommendation> uniqueRecommendations = new LinkedHashMap<>();
        for (String genre : preferredGenres) {
            List<SearchAlbum> candidates = itunesService.search(genre, "album");
            for (SearchAlbum candidate : candidates) {
                if (!savedCatalogIds.contains(candidate.appleCatalogId())) {
                    uniqueRecommendations.putIfAbsent(candidate.appleCatalogId(), new Recommendation(candidate, "Based on your interest in " + genre));
                }
                if (uniqueRecommendations.size() >= 8) {
                    return List.copyOf(uniqueRecommendations.values());
                }
            }
        }
        return List.copyOf(uniqueRecommendations.values());
    }
}
