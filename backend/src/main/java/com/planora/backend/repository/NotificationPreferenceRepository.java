package com.planora.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.planora.backend.model.NotificationChannel;
import com.planora.backend.model.NotificationPreference;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    Optional<NotificationPreference> findByUserUserIdAndProjectIsNullAndEventTypeAndChannel(
            Long userId, String eventType, NotificationChannel channel
    );

    Optional<NotificationPreference> findByUserUserIdAndProjectIdAndEventTypeAndChannel(
            Long userId, Long projectId, String eventType, NotificationChannel channel
    );

    List<NotificationPreference> findByUserUserIdAndProjectIsNullOrderByEventTypeAscChannelAsc(Long userId);

    List<NotificationPreference> findByUserUserIdAndProjectIdOrderByEventTypeAscChannelAsc(Long userId, Long projectId);
}