package com.musiccatalog.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    @Test
    void create_shouldGenerateToken_thatCanBeDecoded() {
        JwtService jwtService = new JwtService("abcdefghijklmnopqrstuvwxyz123456", 10_000);
        String token = jwtService.create("user@example.com");

        assertNotNull(token);
        assertEquals("user@example.com", jwtService.email(token));
    }

    @Test
    void email_shouldRejectInvalidToken() {
        JwtService jwtService = new JwtService("abcdefghijklmnopqrstuvwxyz123456", 10_000);

        assertThrows(JwtException.class, () -> jwtService.email("not-a-valid-token"));
    }
}
