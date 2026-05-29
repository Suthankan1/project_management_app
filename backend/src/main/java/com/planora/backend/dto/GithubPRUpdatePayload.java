package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubPRUpdatePayload {
    private String type;
    private int prNumber;
    private String prTitle;
    private String prUrl;
    private String authorLogin;
}
