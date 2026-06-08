package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class PhotoUploadResponse {
    private boolean success;
    private String message;
    private String photoUrl;
    private String errorCode;
    private String fileUrl;

    public PhotoUploadResponse(boolean success, String message, String url, String errorCode) {
        this.success = success;
        this.message = message;
        this.photoUrl = url;
        this.fileUrl = url;
        this.errorCode = errorCode;
    }
}
