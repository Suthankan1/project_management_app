package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskStatusPatchDTO {
    @NotBlank(message = "Status is required")
    @Size(max = 255, message = "Status must be 255 characters or fewer")
    private String status;
}
