package com.planora.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GithubLinkTaskRequestDTO {

    @NotNull(message = "Task ID is required")
    private Long taskId;
}
