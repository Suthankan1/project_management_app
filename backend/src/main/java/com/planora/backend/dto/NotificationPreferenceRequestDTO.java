package com.planora.backend.dto;

import com.planora.backend.model.NotificationChannel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceRequestDTO {
    private Long projectId;
    private String eventType;
    private NotificationChannel channel;
    private boolean enabled;
}