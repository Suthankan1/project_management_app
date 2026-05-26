package com.planora.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GithubIssueImportRequestDTO {

    @NotNull
    private Long projectId;

    @NotBlank
    private String repoFullName;

    @NotEmpty
    private List<Integer> issueNumbers;
}
