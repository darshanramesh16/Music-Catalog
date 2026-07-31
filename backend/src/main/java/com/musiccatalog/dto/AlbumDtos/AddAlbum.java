package com.musiccatalog.dto.AlbumDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AddAlbum(
    @NotNull(message = "Apple catalog ID is required")
    Long appleCatalogId,
    
    @NotBlank(message = "Title is required")
    String title,
    
    @NotBlank(message = "Artist name is required")
    String artistName,
    
    String genre,
    
    LocalDate releaseDate,
    
    Integer trackCount,
    
    String artworkUrl
) {}