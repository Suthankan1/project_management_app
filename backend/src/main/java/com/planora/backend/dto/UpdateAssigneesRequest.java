package com.planora.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for PATCH /api/tasks/{taskId}/assignees.
 * Replaces the multi-assignee list in a single atomic operation.
 * An empty list is valid (it clears all assignees).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssigneesRequest {

    /**
     * The complete list of user IDs that should be assigned to the task.
     * Sending an empty list removes all assignees.
     * Must not be null; individual IDs must be positive.
     */
    @NotNull(message = "assigneeIds must not be null — send an empty list [] to clear assignees")
    private List<@NotNull @Positive(message = "Each assignee ID must be a positive number") Long> assigneeIds;
}
