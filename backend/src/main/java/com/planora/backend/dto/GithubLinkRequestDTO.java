package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class GithubLinkRequestDTO {

    @NotNull(message = "Project ID is required")
    @Positive(message = "Project ID must be positive")
    private Long projectId;

    @NotBlank(message = "Repository full name is required (e.g. owner/repo)")
    @Size(max = 255, message = "Repository full name must be 255 characters or fewer")
    private String repositoryFullName;

    @Pattern(regexp = "^(PERSONAL_ACCESS_TOKEN|OAUTH)$", message = "Token type must be PERSONAL_ACCESS_TOKEN or OAUTH")
    private String tokenType = "PERSONAL_ACCESS_TOKEN";
}
