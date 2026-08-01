package com.musiccatalog.service;

import com.musiccatalog.dto.AuthDtos.Credentials;
import com.musiccatalog.dto.AuthDtos.TokenResponse;
import com.musiccatalog.entity.User;
import com.musiccatalog.exception.ApiException;
import com.musiccatalog.repository.UserRepository;
import com.musiccatalog.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private PasswordEncoder passwords;

    @Mock
    private JwtService jwt;

    @InjectMocks
    private AuthService authService;

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
    void register_shouldEncodePasswordAndSaveUser() {
        Credentials credentials = new Credentials("Test@Example.com", "secret123");
        when(users.existsByEmail("test@example.com")).thenReturn(false);
        when(passwords.encode("secret123")).thenReturn("encoded-secret");
        when(jwt.create("test@example.com")).thenReturn("jwt-token");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TokenResponse result = authService.register(credentials);

        assertEquals("jwt-token", result.token());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        assertEquals("test@example.com", captor.getValue().getEmail());
        assertEquals("encoded-secret", captor.getValue().getPassword());
        assertNotEquals("secret123", captor.getValue().getPassword());
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        Credentials credentials = new Credentials("test@example.com", "secret123");
        when(users.existsByEmail("test@example.com")).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class,
                () -> authService.register(credentials));

        assertEquals(409, exception.status().value());
        verify(users, never()).save(any());
    }

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {
        User user = new User();
        setId(user, 1L);
        user.setEmail("test@example.com");
        user.setPassword("encoded-secret");

        Credentials credentials = new Credentials("test@example.com", "secret123");
        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwords.matches("secret123", "encoded-secret")).thenReturn(true);
        when(jwt.create("test@example.com")).thenReturn("jwt-token");

        TokenResponse result = authService.login(credentials);

        assertEquals("jwt-token", result.token());
    }
}
