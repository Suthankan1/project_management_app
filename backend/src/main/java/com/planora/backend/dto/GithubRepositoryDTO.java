package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubRepositoryDTO {
    private Long integrationId;
    private Long projectId;
    private String repositoryFullName;
    private String repositoryUrl;
    private String tokenType;
    private boolean active;
}
