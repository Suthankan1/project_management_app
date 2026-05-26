package com.planora.backend.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;

import lombok.Data;

@Data
public class GithubCommentDTO {

    private Long id;

    private String body;

    private String userLogin;

    private String userAvatarUrl;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonSetter("user")
    public void setUser(GithubCommentUserDTO user) {
        if (user != null) {
            userLogin = user.getLogin();
            userAvatarUrl = user.getAvatarUrl();
        }
    }

    @Data
    public static class GithubCommentUserDTO {
        private String login;

        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}
