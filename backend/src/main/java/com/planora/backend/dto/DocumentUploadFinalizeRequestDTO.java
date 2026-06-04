package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DocumentUploadFinalizeRequestDTO {

    @NotBlank(message = "fileName is required")
    @Size(max = 255, message = "File name must be 255 characters or fewer")
    private String fileName;

    @NotBlank(message = "contentType is required")
    @Size(max = 255, message = "Content type must be 255 characters or fewer")
    private String contentType;

    @NotNull(message = "fileSize is required")
    @Min(value = 1, message = "fileSize must be > 0")
    @Max(value = 104857600, message = "Maximum file size is 100MB")
    private Long fileSize;

    @NotBlank(message = "objectKey is required")
    @Size(max = 500, message = "Object key must be 500 characters or fewer")
    private String objectKey;

    @Positive(message = "Folder ID must be positive")
    private Long folderId;
}
