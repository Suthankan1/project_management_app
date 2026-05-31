package com.planora.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TeamCreationDTO {
    @NotBlank(message = "Team name is required")
    @Size(max = 255, message = "Team name must be 255 characters or fewer")
    private String name;

    private List<@Email(message = "Invalid email format") String> inviteEmails;
}
