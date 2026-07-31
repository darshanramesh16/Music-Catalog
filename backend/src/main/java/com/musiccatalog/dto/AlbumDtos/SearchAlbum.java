package com.musiccatalog.dto.AlbumDtos;

import java.time.LocalDate;

public record SearchAlbum(
    long appleCatalogId,
    String title,
    String artistName,
    String genre,
    LocalDate releaseDate,
    Integer trackCount,
    String artworkUrl
) {}