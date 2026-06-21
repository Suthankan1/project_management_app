package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for PATCH /api/tasks/{taskId}/status.
 * Lightweight endpoint used for Kanban drag-and-drop column moves.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    /** The target status value to apply to the task. */
    @NotBlank(message = "status must not be blank")
    @Size(max = 255, message = "status must be 255 characters or fewer")
    private String status;
}
