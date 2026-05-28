// Composite response for notification list fetches, including the unread badge count.
package com.planora.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFeedResponseDTO {
    private List<NotificationResponseDTO> notifications;
    private long unreadCount;
}