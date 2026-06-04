package com.planora.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for PATCH /api/tasks/reorder.
 * Specifies the target project, an optional sprint scope, and the desired
 * task ordering. Replaces the previous raw {@code Map<String, Object>} body
 * and removes all manual casting / ClassCastException risk.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderTasksRequest {

    /**
     * The project that owns the tasks being reordered. Required.
     */
    @NotNull(message = "projectId must not be null")
    @Positive(message = "projectId must be a positive number")
    private Long projectId;

    /**
     * Optional sprint context. Null means the backlog / un-sprinted list.
     */
    private Long sprintId;

    /**
     * Ordered list of task IDs reflecting the desired display position.
     * Must not be null; may be empty (no-op reorder is allowed).
     */
    @NotNull(message = "orderedTaskIds must not be null — send an empty list [] for a no-op")
    private List<@NotNull @Positive(message = "Each task ID must be a positive number") Long> orderedTaskIds;
}
