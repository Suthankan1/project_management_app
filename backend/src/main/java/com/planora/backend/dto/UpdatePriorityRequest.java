package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for PATCH /api/tasks/{taskId}/priority.
 * Lightweight endpoint used by Kanban and List view priority pickers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePriorityRequest {

    /** The priority level to apply. Must be one of the known enum values. */
    @NotBlank(message = "priority must not be blank")
    @Pattern(
        regexp = "^(LOW|NORMAL|MEDIUM|HIGH|URGENT)$",
        message = "priority must be one of: LOW, NORMAL, MEDIUM, HIGH, URGENT"
    )
    private String priority;
}
