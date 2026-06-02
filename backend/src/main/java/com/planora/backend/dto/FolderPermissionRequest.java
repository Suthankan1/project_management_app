package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record FolderPermissionRequest(
    @NotBlank(message = "teamRole is required")
    @Pattern(regexp = "^(OWNER|ADMIN|MEMBER|VIEWER)$", message = "teamRole must be OWNER, ADMIN, MEMBER, or VIEWER")
    String teamRole,

    @NotEmpty(message = "permissions list cannot be empty")
    List<@NotBlank(message = "permission must not be blank") @Pattern(regexp = "^(READ|WRITE|MANAGE)$", message = "permission must be READ, WRITE, or MANAGE") String> permissions
) {
}
