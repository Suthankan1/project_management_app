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
public class GithubCommitDTO {
    private Long id;
    private Long integrationId;
    private String sha;
    private String shortSha;
    private String message;
    private String authorName;
    private String authorEmail;
    private String commitUrl;
    private Long linkedTaskId;
    private LocalDateTime authoredAt;
}
