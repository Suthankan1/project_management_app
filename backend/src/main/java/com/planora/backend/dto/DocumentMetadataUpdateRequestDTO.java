package com.planora.backend.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DocumentMetadataUpdateRequestDTO {
    @Size(max = 255, message = "Document name must be 255 characters or fewer")
    private String name;

    @Positive(message = "Folder ID must be positive")
    private Long folderId;
}
