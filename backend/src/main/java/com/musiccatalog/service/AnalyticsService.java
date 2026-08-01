package com.musiccatalog.service;

import com.musiccatalog.dto.AnalyticsDtos.*;
import com.musiccatalog.entity.Album;
import com.musiccatalog.exception.ApiException;
import com.musiccatalog.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

@Service
public class AnalyticsService {
    private final AlbumRepository albums;
    private final UserRepository users;

    public AnalyticsService(AlbumRepository a, UserRepository u) {
        albums = a;
        users = u;
    }

    private List<Album> list(String email) {
        var u = users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return albums.findAllByUserIdOrderByCreatedAtDesc(u.getId());
    }

    private List<Count> count(List<Album> a, Function<Album, String> f) {
        return a.stream().map(f).filter(x -> x != null && !x.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting())).entrySet().stream()
                .map(x -> new Count(x.getKey(), x.getValue())).sorted(Comparator.comparingLong(Count::count).reversed())
                .toList();
    }

    private List<Count> trackDistribution(List<Album> albums) {
        var buckets = new LinkedHashMap<String, Long>();
        buckets.put("1–5", 0L);
        buckets.put("6–10", 0L);
        buckets.put("11–15", 0L);
        buckets.put("16–20", 0L);
        buckets.put("21+", 0L);
        albums.stream().map(Album::getTrackCount).filter(Objects::nonNull).forEach(count -> {
            var label = count <= 5 ? "1–5"
                    : count <= 10 ? "6–10" : count <= 15 ? "11–15" : count <= 20 ? "16–20" : "21+";
            buckets.put(label, buckets.get(label) + 1);
        });
        return buckets.entrySet().stream().map(x -> new Count(x.getKey(), x.getValue())).toList();
    }

    public Analytics analytics(String email) {
        List<Album> a = list(email);
        Map<LocalDate, Long> byDay = a.stream().collect(Collectors.groupingBy(
                x -> x.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate(), TreeMap::new, Collectors.counting()));
        long total = 0;
        List<Growth> growth = new ArrayList<>();
        for (var e : byDay.entrySet()) {
            total += e.getValue();
            growth.add(new Growth(e.getKey().toString(), total));
        }
        return new Analytics(count(a, Album::getGenre), count(a, Album::getArtistName).stream().limit(10).toList(),
                growth, count(a, x -> x.getReleaseDate() == null ? null : String.valueOf(x.getReleaseDate().getYear())),
                trackDistribution(a), a.size());
    }

    public List<Album> library(String email) {
        return list(email);
    }
}
