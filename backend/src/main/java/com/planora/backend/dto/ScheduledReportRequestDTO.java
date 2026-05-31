package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Request DTO for creating a new scheduled report.
 */
@Getter
@Setter
public class ScheduledReportRequestDTO {

    @NotNull(message = "Project ID is required")
    @Positive(message = "Project ID must be positive")
    private Long projectId;

    /** PDF | EXCEL | BOTH */
    @NotBlank(message = "Format is required")
    @Pattern(regexp = "^(PDF|EXCEL|BOTH)$", message = "Format must be PDF, EXCEL, or BOTH")
    private String format;

    /** ONE_TIME | RECURRING */
    @NotBlank(message = "Schedule type is required")
    @Pattern(regexp = "^(ONE_TIME|RECURRING)$", message = "Schedule type must be ONE_TIME or RECURRING")
    private String scheduleType;

    // ── Recurrence config ────────────────────────────────────────────────────

    /** DAILY | WEEKLY | MONTHLY | CUSTOM  (null for ONE_TIME) */
    @Pattern(regexp = "^(DAILY|WEEKLY|MONTHLY|CUSTOM)$", message = "Frequency must be DAILY, WEEKLY, MONTHLY, or CUSTOM")
    private String frequency;

    /** Used when frequency = CUSTOM */
    @Min(value = 1, message = "Custom interval days must be at least 1")
    private Integer customIntervalDays;

    /** HH:mm — required */
    @NotBlank(message = "Send time is required")
    @Pattern(regexp = "^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$", message = "Send time must be in HH:mm format")
    private String sendTime;

    /** 0=Sun … 6=Sat for WEEKLY */
    @Min(value = 0, message = "Send day of week must be between 0 and 6")
    @Max(value = 6, message = "Send day of week must be between 0 and 6")
    private Integer sendDayOfWeek;

    /** 1-31 for MONTHLY */
    @Min(value = 1, message = "Send day of month must be between 1 and 31")
    @Max(value = 31, message = "Send day of month must be between 1 and 31")
    private Integer sendDayOfMonth;

    /** ISO date string (YYYY-MM-DD) for ONE_TIME */
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Scheduled date must be in YYYY-MM-DD format")
    private String scheduledDate;

    /** Timezone string from client (e.g. Asia/Kolkata). Defaults to UTC. */
    @Size(max = 255, message = "Timezone must be 255 characters or fewer")
    private String timezone;

    // ── Recipients ───────────────────────────────────────────────────────────

    @NotEmpty(message = "Recipients To list is required")
    private List<@Email(message = "Invalid email format in recipientsTo") String> recipientsTo;
    private List<@Email(message = "Invalid email format in recipientsCc") String> recipientsCc;
    private List<@Email(message = "Invalid email format in recipientsBcc") String> recipientsBcc;

    // ── Email content ────────────────────────────────────────────────────────

    @Size(max = 255, message = "Subject must be 255 characters or fewer")
    private String subject;
    @Size(max = 2000, message = "Body message must be 2000 characters or fewer")
    private String bodyMessage;

    // ── End condition (RECURRING) ────────────────────────────────────────────

    /** AFTER_N | UNTIL_DATE | MANUAL */
    @Pattern(regexp = "^(AFTER_N|UNTIL_DATE|MANUAL)$", message = "End type must be AFTER_N, UNTIL_DATE, or MANUAL")
    private String endType;
    @Min(value = 1, message = "End after count must be at least 1")
    private Integer endAfterCount;

    /** ISO date string (YYYY-MM-DD) */
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "End date must be in YYYY-MM-DD format")
    private String endDate;
}
