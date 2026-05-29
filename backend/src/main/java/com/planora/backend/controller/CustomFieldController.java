package com.planora.backend.controller;

import com.planora.backend.dto.*;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.CustomFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldService customFieldService;

    @GetMapping("/projects/{projectId}/custom-fields")
    public ResponseEntity<List<CustomFieldResponseDTO>> getProjectCustomFields(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customFieldService.getProjectCustomFields(projectId, principal.getUserId()));
    }

    @PostMapping("/projects/{projectId}/custom-fields")
    public ResponseEntity<CustomFieldResponseDTO> createCustomField(
            @PathVariable Long projectId,
            @RequestBody CustomFieldRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(
                customFieldService.createCustomField(projectId, dto, principal.getUserId()),
                HttpStatus.CREATED);
    }

    @DeleteMapping("/projects/{projectId}/custom-fields/{fieldId}")
    public ResponseEntity<Void> deleteCustomField(
            @PathVariable Long projectId,
            @PathVariable Long fieldId,
            @AuthenticationPrincipal UserPrincipal principal) {
        customFieldService.deleteCustomField(projectId, fieldId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{taskId}/custom-fields")
    public ResponseEntity<List<TaskCustomFieldResponseDTO>> getTaskCustomFields(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customFieldService.getTaskCustomFields(taskId, principal.getUserId()));
    }

    @PatchMapping("/tasks/{taskId}/custom-fields")
    public ResponseEntity<Void> patchTaskCustomField(
            @PathVariable Long taskId,
            @RequestBody TaskFieldValuePatchDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        customFieldService.patchTaskCustomField(taskId, dto, principal.getUserId());
        return ResponseEntity.ok().build();
    }
}
