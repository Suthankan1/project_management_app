package com.planora.backend.dto;

import com.planora.backend.model.ProjectType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {

    @NotBlank(message = "Project name is required")
    @Size(max = 100, message = "Project name must be 100 characters or less")
    private String name;

    @Size(max = 2000, message = "Description must be 2000 characters or fewer")
    private String description;

    @NotNull(message = "Project type is required")
    private ProjectType type;

    @NotBlank(message = "Project key is required")
    @Pattern(regexp = "^[A-Z0-9-]{2,10}$", message = "Project key must be 2-10 uppercase letters/numbers")
    private String projectKey;

    @Positive(message = "Owner ID must be positive")
    private Long ownerId;

    @Pattern(regexp = "^(EXISTING|NEW)$", message = "Team option must be EXISTING or NEW")
    private String teamOption; // "EXISTING" or "NEW"

    @Size(max = 255, message = "Team name must be 255 characters or fewer")
    private String teamName; // Required if teamOption is "NEW"

    @Positive(message = "Team ID must be positive")
    private Long teamId;
}