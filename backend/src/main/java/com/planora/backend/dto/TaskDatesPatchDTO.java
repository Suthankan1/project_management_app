package com.planora.backend.dto;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class TaskDatesPatchDTO {
    private LocalDate startDate;
    private LocalDate dueDate;

    @JsonIgnore
    private boolean startDateProvided = false;

    @JsonIgnore
    private boolean dueDateProvided = false;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
        this.startDateProvided = true;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
        this.dueDateProvided = true;
    }

    public boolean isStartDateProvided() {
        return startDateProvided;
    }

    public boolean isDueDateProvided() {
        return dueDateProvided;
    }
}
