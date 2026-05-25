package com.planora.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Minimal repository payload for the GitHub repo picker.
 * Field names intentionally match the GitHub REST API response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubRepositoryDTO {

    private long id;
    private String name;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("private")
    private boolean privateRepo;

    private OwnerDTO owner;

    @JsonProperty("default_branch")
    private String defaultBranch;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerDTO {
        private String login;
    }
}