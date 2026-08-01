package com.musiccatalog.service;

import com.musiccatalog.dto.AlbumDtos.AddAlbum;
import com.musiccatalog.dto.AlbumDtos.LibraryAlbum;
import com.musiccatalog.dto.AlbumDtos.UpdateAlbum;
import com.musiccatalog.entity.Album;
import com.musiccatalog.entity.User;
import com.musiccatalog.exception.ApiException;
import com.musiccatalog.repository.AlbumRepository;
import com.musiccatalog.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LibraryServiceTest {

    @Mock
    private AlbumRepository albums;

    @Mock
    private UserRepository users;

    @InjectMocks
    private LibraryService libraryService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private static void setId(Object entity, Long id) {
        try {
            Field field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void addAlbum_shouldSaveAlbum_whenAlbumDoesNotExist() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");

        AddAlbum request = new AddAlbum(123L, "Test Album", "Test Artist", "Rock", null, 10,
                "https://example.com/art.jpg");

        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(albums.existsByUserIdAndAppleCatalogId(1L, 123L)).thenReturn(false);
        when(albums.save(any(Album.class))).thenAnswer(invocation -> {
            Album saved = invocation.getArgument(0);
            setId(saved, 2L);
            return saved;
        });

        LibraryAlbum result = libraryService.add("test@example.com", request);

        assertEquals(2L, result.id());
        assertEquals(123L, result.appleCatalogId());
        assertEquals("Test Album", result.title());
        assertEquals("Test Artist", result.artistName());
        assertEquals("Rock", result.genre());

        ArgumentCaptor<Album> savedAlbum = ArgumentCaptor.forClass(Album.class);
        verify(albums).save(savedAlbum.capture());
        assertEquals(1L, savedAlbum.getValue().getUser().getId());
        assertEquals(123L, savedAlbum.getValue().getAppleCatalogId());
    }

    @Test
    void addAlbum_shouldRejectDuplicateAlbum() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");

        AddAlbum request = new AddAlbum(123L, "Test Album", "Test Artist", "Rock", null, 10,
                "https://example.com/art.jpg");

        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(albums.existsByUserIdAndAppleCatalogId(1L, 123L)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class,
                () -> libraryService.add("test@example.com", request));

        assertEquals(409, exception.status().value());
        verify(albums, never()).save(any());
    }

    @Test
    void updateAlbum_shouldUpdateRatingAndNotes() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");

        Album album = new Album();
        setId(album, 2L);
        album.setUser(user);
        album.setAppleCatalogId(123L);
        album.setTitle("Test Album");
        album.setArtistName("Test Artist");
        album.setGenre("Rock");
        album.setReleaseDate(null);
        album.setTrackCount(10);
        album.setArtworkUrl("https://example.com/art.jpg");

        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(albums.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(album));

        UpdateAlbum request = new UpdateAlbum(4, "Great album");
        LibraryAlbum result = libraryService.update("test@example.com", 2L, request);

        assertEquals(4, result.userRating());
        assertEquals("Great album", result.userNotes());
        verify(albums, never()).save(any());
    }

    @Test
    void deleteAlbum_shouldDeleteOwnedAlbum() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");

        Album album = new Album();
        setId(album, 2L);
        album.setUser(user);

        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(albums.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(album));

        libraryService.delete("test@example.com", 2L);

        verify(albums).delete(album);
    }

    @Test
    void updateAlbum_shouldRejectIfNotOwned() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");

        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(albums.findByIdAndUserId(2L, 1L)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class,
                () -> libraryService.update("test@example.com", 2L, new UpdateAlbum(3, "notes")));

        assertEquals(404, exception.status().value());
        verify(albums, never()).save(any());
    }
}
