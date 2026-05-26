package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GithubCommentSyncResponseDTO {
    private int synced;
}
