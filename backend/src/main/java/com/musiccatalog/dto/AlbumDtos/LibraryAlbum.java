package com.musiccatalog.dto.AlbumDtos;

import java.time.Instant;
import java.time.LocalDate;

public record LibraryAlbum(
    Long id,
    long appleCatalogId,
    String title,
    String artistName,
    String genre,
    LocalDate releaseDate,
    Integer trackCount,
    String artworkUrl,
    Integer userRating,
    String userNotes,
    Instant createdAt,
    Instant updatedAt
) {}