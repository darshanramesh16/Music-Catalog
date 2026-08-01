package com.musiccatalog.dto.AnalyticsDtos;

import java.util.List;

public record Analytics(
        List<Count> genres,
        List<Count> artists,
        List<Growth> growth,
        List<Count> releasesByYear,
        List<Count> trackDistribution,
        int totalAlbums) {
}