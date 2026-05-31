package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DocumentFolderCreateRequestDTO {

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "Folder name must be 255 characters or fewer")
    private String name;

    @Positive(message = "Parent folder ID must be positive")
    private Long parentFolderId;
}
