package com.planora.backend.service;

import com.planora.backend.model.User;
import com.planora.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserCacheServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserCacheService userCacheService;

    private User buildUser(Long id, String email, String username) {
        User u = new User();
        u.setUserId(id);
        u.setEmail(email);
        u.setUsername(username);
        return u;
    }

    @Test
    void resolveUserByEmailOrUsername_returnsNull_whenIdentityIsNull() {
        User result = userCacheService.resolveUserByEmailOrUsername(null);
        assertNull(result);
        verifyNoInteractions(userRepository);
    }

    @Test
    void resolveUserByEmailOrUsername_returnsNull_whenIdentityIsBlank() {
        User result = userCacheService.resolveUserByEmailOrUsername("   ");
        assertNull(result);
        verifyNoInteractions(userRepository);
    }

    @Test
    void resolveUserByEmailOrUsername_findsUserByEmail() {
        User user = buildUser(1L, "alice@example.com", "alice");
        when(userRepository.findFirstByEmailIgnoreCase("alice@example.com")).thenReturn(Optional.of(user));

        User result = userCacheService.resolveUserByEmailOrUsername("alice@example.com");

        assertNotNull(result);
        assertEquals("alice@example.com", result.getEmail());
    }

    @Test
    void resolveUserByEmailOrUsername_fallsBackToUsername_whenEmailNotFound() {
        User user = buildUser(1L, "alice@example.com", "alice");
        when(userRepository.findFirstByEmailIgnoreCase("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.findFirstByUsernameIgnoreCase("alice@example.com")).thenReturn(Optional.of(user));

        User result = userCacheService.resolveUserByEmailOrUsername("alice@example.com");

        assertNotNull(result);
    }

    @Test
    void resolveUserByEmailOrUsername_findsUserByUsername() {
        User user = buildUser(1L, "alice@example.com", "alice");
        when(userRepository.findFirstByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));

        User result = userCacheService.resolveUserByEmailOrUsername("alice");

        assertNotNull(result);
        assertEquals("alice", result.getUsername());
    }

    @Test
    void resolveUserByEmailOrUsername_fallsBackToEmail_whenUsernameNotFound() {
        User user = buildUser(1L, "alice@example.com", "alice");
        when(userRepository.findFirstByUsernameIgnoreCase("aliasname")).thenReturn(Optional.empty());
        when(userRepository.findFirstByEmailIgnoreCase("aliasname")).thenReturn(Optional.of(user));

        User result = userCacheService.resolveUserByEmailOrUsername("aliasname");

        assertNotNull(result);
    }

    @Test
    void resolveUserByEmailOrUsername_returnsNull_whenNeitherEmailNorUsernameFound() {
        when(userRepository.findFirstByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());
        when(userRepository.findFirstByEmailIgnoreCase("ghost")).thenReturn(Optional.empty());

        User result = userCacheService.resolveUserByEmailOrUsername("ghost");

        assertNull(result);
    }
}
