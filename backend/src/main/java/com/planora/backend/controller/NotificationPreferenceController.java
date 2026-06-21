package com.planora.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.NotificationPreferenceRequestDTO;
import com.planora.backend.dto.NotificationPreferenceResponseDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.NotificationPreferenceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService notificationPreferenceService;

    @GetMapping
    public ResponseEntity<List<NotificationPreferenceResponseDTO>> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(notificationPreferenceService.getPreferenceMatrix(principal.getUserId(), projectId));
    }

    @PutMapping
    public ResponseEntity<NotificationPreferenceResponseDTO> upsertPreference(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody NotificationPreferenceRequestDTO request) {
        return ResponseEntity.ok(notificationPreferenceService.upsertPreference(principal.getUserId(), request));
    }
}