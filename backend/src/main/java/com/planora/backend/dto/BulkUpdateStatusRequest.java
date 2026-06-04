package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for PATCH /api/tasks/bulk/status.
 * Atomically sets the same status value on a batch of tasks.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateStatusRequest {

    /** The task IDs to update. Must contain at least one entry. */
    @NotEmpty(message = "taskIds must not be empty")
    private List<@NotNull @Positive(message = "Each task ID must be a positive number") Long> taskIds;

    /** The target status value to apply to every listed task. */
    @NotBlank(message = "status must not be blank")
    @Size(max = 255, message = "status must be 255 characters or fewer")
    private String status;
}
