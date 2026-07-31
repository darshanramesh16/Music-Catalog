package com.musiccatalog.controller;

import com.musiccatalog.dto.AlbumDtos.SearchAlbum;
import com.musiccatalog.exception.ApiException;
import com.musiccatalog.service.ItunesService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final ItunesService itunesService;

    public SearchController(ItunesService itunesService) {
        this.itunesService = itunesService;
    }

    @GetMapping
    public List<SearchAlbum> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "album") String type) {
        if (!"album".equalsIgnoreCase(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only album searches are supported");
        }
        return itunesService.search(query, type.toLowerCase());
    }
}
