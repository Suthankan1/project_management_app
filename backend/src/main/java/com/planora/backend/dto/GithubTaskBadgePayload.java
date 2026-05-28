package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubTaskBadgePayload {
    private Long taskId;
    private Long githubIssueNumber;
    private String githubRepoFullName;
    private String issueState;
}
