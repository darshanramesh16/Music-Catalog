package com.musiccatalog.dto.AlbumDtos;

public record Recommendation(
    SearchAlbum album,
    String reason
) {}