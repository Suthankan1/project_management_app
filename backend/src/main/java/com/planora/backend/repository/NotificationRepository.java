// Repository interface for managing Notification entity persistence and querying.
package com.planora.backend.repository;

import com.planora.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Retrieves all notifications for a user ordered by newest first.
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long userId);

    // Counts how many unread notifications a user has.
    long countByRecipientUserIdAndIsReadFalse(Long userId);

    // Retrieves only unread notifications for a user ordered by newest first.
    List<Notification> findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Returns the notification feed and the total unread count in one HQL query.
     * Hibernate evaluates the COUNT(...) FILTER (...) window once and repeats the
     * aggregate on each row, so the service can derive both the list and badge count
     * without a second database round-trip.
     */
    @Query("""
            select n as notification,
                   count(n) filter (where n.isRead = false) over () as unreadCount
            from Notification n
            where n.recipient.userId = :userId
            order by n.createdAt desc
            """)
        List<NotificationFeedRow> findNotificationFeedByRecipientUserId(@Param("userId") Long userId);

    /**
     * Duplicate-prevention guard: returns true if an identical notification
     * (same recipient, message text, and deep-link) already exists within the
     * supplied time window.  Used by NotificationService to de-duplicate chat
     * mentions and DM alerts that could otherwise fire multiple times for a
     * single message event.
     */
    boolean existsByRecipientUserIdAndMessageAndLinkAndCreatedAtAfter(
            Long userId, String message, String link, LocalDateTime after
    );

    boolean existsByRecipientUserIdAndLinkAndMessageStartingWith(
            Long userId, String link, String messagePrefix
    );

        interface NotificationFeedRow {
                Notification getNotification();

                Long getUnreadCount();
        }
}
