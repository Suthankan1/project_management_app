package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGithubUsernameRequest {

    @NotBlank(message = "GitHub username is required")
    @Pattern(
            regexp = "^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$",
            message = "GitHub username must be 1 to 39 characters and contain only letters, numbers, and hyphens"
    )
    private String githubUsername;
}