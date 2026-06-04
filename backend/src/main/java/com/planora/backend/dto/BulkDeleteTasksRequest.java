package com.planora.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for DELETE /api/tasks/bulk.
 * Permanently removes the listed tasks in a single operation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteTasksRequest {

    /** The task IDs to delete. Must contain at least one entry. */
    @NotEmpty(message = "taskIds must not be empty")
    private List<@NotNull @Positive(message = "Each task ID must be a positive number") Long> taskIds;
}
