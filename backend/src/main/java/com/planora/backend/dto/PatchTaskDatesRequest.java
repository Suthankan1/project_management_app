package com.planora.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request body for PATCH /api/tasks/{taskId}/dates.
 * Used by calendar and Gantt chart drag-and-drop.
 *
 * Both dates are individually optional. The presence flags distinguish between
 * "field was omitted" (no change) and "field was explicitly set to null" (clear date),
 * using the same pattern as sprintId/milestoneId in TaskRequestDTO.
 */
@Data
@NoArgsConstructor
public class PatchTaskDatesRequest {

    private LocalDate startDate;

    @JsonIgnore
    private boolean startDateProvided;

    private LocalDate dueDate;

    @JsonIgnore
    private boolean dueDateProvided;

    @JsonSetter("startDate")
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
        this.startDateProvided = true;
    }

    @JsonSetter("dueDate")
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
        this.dueDateProvided = true;
    }
}
