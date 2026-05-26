package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class GithubCreateIssueRequestDTO {

    @NotNull(message = "Integration ID is required")
    private Long integrationId;

    @NotBlank(message = "Issue title is required")
    private String title;

    private String body;

    private List<String> labels;
}
