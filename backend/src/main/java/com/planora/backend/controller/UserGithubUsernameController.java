package com.planora.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.UpdateGithubUsernameRequest;
import com.planora.backend.dto.UserResponseDTO;
import com.planora.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/me")
public class UserGithubUsernameController {

    @Autowired
    private UserService service;

    @PutMapping("/github-username")
    public ResponseEntity<?> updateGithubUsername(
            @Valid @RequestBody UpdateGithubUsernameRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        try {
            UserResponseDTO response = service.updateGithubUsernameAndGetDTO(authentication.getName(), request.getGithubUsername());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update GitHub username: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/github-username")
    public ResponseEntity<?> unlinkGithubUsername(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        try {
            UserResponseDTO response = service.unlinkGithubUsernameAndGetDTO(authentication.getName());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to unlink GitHub username: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}