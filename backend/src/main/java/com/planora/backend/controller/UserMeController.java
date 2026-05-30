package com.planora.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.PushTokenRequestDTO;
import com.planora.backend.dto.UserResponseDTO;
import com.planora.backend.service.UserPushTokenService;
import com.planora.backend.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
// Maintaining a dedicated controller or endpoint for the "current user"
// keeps user-context operations distinct from broader administrative actions (like fetching all users).
public class UserMeController {

    private final UserService service;

    @Autowired
    private UserPushTokenService pushTokenService;

    /* Frontend calls this endpoint immediately after login or upon hard page refresh.
        It allows fronted to blindly send its auth token and "hydrate" the app state with the current
        user's profile, avatar, and permissions without needing to know ther user ID upfront */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        try {
            /* We extract the user's identifier (usually their email)
              directly from the cryptographically verified token. This prevents Insecure Direct
              Object Reference (IDOR) vulnerabilities, making it impossible for a malicious user
              to fetch someone else's profile by manipulating a request parameter */
            UserResponseDTO dto = service.getCurrentUserDTO(authentication.getName());
            return new ResponseEntity<>(dto, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to fetch current user: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/me/push-token")
    public ResponseEntity<?> registerPushToken(Authentication authentication, @RequestBody PushTokenRequestDTO request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        try {
            pushTokenService.registerPushToken(authentication.getName(), request.getPushToken(), request.getPlatform());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to save push token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/me/logout-all")
    public ResponseEntity<?> logoutAllSessions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        try {
            service.logoutAllSessions(authentication.getName());
            return new ResponseEntity<>(java.util.Map.of("message", "Logged out from all sessions successfully"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to logout all sessions: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
