package com.planora.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectStorageQuotaResponseDTO {
    private Long usedBytes;
    private Long quotaBytes;
    private Long maxFileSizeBytes;
    private Long documentCount;
    private String humanReadableUsed;
    private String humanReadableQuota;
}
