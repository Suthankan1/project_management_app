package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubStatsDTO {
    private long totalPullRequests;
    private long openPullRequests;
    private long mergedPullRequests;
    private long closedPullRequests;
    private long totalCommits;
    private long totalIssues;
    private long openIssues;
    private long closedIssues;
    private int linkedRepositories;
}
