package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubIssueDTO {
    private Long id;
    private Long integrationId;
    private Integer githubIssueNumber;
    private String title;
    private String body;
    private String state;
    private String authorLogin;
    private String githubUrl;
    private List<String> labels;
    private Long linkedTaskId;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
}
