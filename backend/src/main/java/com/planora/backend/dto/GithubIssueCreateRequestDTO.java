package com.planora.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GithubIssueCreateRequestDTO {

    @NotBlank
    private String repoFullName;

    @NotBlank
    private String title;

    private String body;

    private List<String> labels;

    private List<String> assignees;
}
