package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DocumentUploadInitRequestDTO {

    @NotBlank(message = "fileName is required")
    @Size(max = 255, message = "File name must be 255 characters or fewer")
    private String fileName;

    @NotBlank(message = "contentType is required")
    @Pattern(
        regexp = "^(application/pdf|application/msword|application/vnd\\.openxmlformats-officedocument\\.wordprocessingml\\.document|application/vnd\\.ms-excel|application/vnd\\.openxmlformats-officedocument\\.spreadsheetml\\.sheet|text/plain|image/jpeg|image/png|image/gif|image/webp)$",
        message = "Unsupported content type"
    )
    private String contentType;

    @NotNull(message = "fileSize is required")
    @Min(value = 1, message = "fileSize must be > 0")
    @Max(value = 104857600, message = "Maximum file size is 100MB")
    private Long fileSize;

    @Positive(message = "Folder ID must be positive")
    private Long folderId;
}
