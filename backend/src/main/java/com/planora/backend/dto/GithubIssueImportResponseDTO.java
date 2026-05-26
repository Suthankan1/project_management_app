package com.planora.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GithubIssueImportResponseDTO {
    private List<Long> imported;
    private List<Integer> skipped;
}
