package com.planora.backend.dto;

import java.util.List;

public record FolderPermissionRequest(String teamRole, List<String> permissions) {
}
