package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GithubLinkRequestDTO {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Repository full name is required (e.g. owner/repo)")
    private String repositoryFullName;

    @NotBlank(message = "Access token is required")
    private String accessToken;

    private String tokenType = "PERSONAL_ACCESS_TOKEN";
}
