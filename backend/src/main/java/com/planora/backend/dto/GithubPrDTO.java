package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubPrDTO {
    private Long id;
    private Long integrationId;
    private Integer githubPrNumber;
    private String title;
    private String body;
    private String state;
    private String authorLogin;
    private String headBranch;
    private String baseBranch;
    private String githubUrl;
    private Long linkedTaskId;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
    private LocalDateTime mergedAt;
}
