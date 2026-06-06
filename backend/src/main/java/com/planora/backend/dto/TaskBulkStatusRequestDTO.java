package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class TaskBulkStatusRequestDTO {
    @NotEmpty(message = "Task IDs list cannot be empty")
    private List<Long> taskIds;

    @NotBlank(message = "Status is required")
    private String status;
}
