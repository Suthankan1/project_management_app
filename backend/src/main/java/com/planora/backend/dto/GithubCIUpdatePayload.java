package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubCIUpdatePayload {
    private String workflow;
    private String branch;
    private String status;
    private String commitSha;
}
