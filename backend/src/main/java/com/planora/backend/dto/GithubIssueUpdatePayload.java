package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubIssueUpdatePayload {
    private String action;
    private int issueNumber;
    private String issueTitle;
    private String actorLogin;
}
