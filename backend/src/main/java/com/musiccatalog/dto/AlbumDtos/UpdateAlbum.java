package com.musiccatalog.dto.AlbumDtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateAlbum(
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    Integer userRating,
    
    String userNotes
) {}