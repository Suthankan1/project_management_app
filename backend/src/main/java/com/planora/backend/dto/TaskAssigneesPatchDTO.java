package com.planora.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TaskAssigneesPatchDTO {
    private List<Long> assigneeIds;
}
