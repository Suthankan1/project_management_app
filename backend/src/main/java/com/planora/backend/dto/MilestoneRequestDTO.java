package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneRequestDTO {
    @NotBlank(message = "Milestone name is required")
    @Size(max = 200, message = "Milestone name must be 200 characters or fewer")
    private String name;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    private String description;

    private LocalDate dueDate;

    @Pattern(
        regexp = "^(OPEN|IN_PROGRESS|COMPLETED|CANCELLED)$",
        message = "Status must be OPEN, IN_PROGRESS, COMPLETED, or CANCELLED"
    )
    private String status;
}
