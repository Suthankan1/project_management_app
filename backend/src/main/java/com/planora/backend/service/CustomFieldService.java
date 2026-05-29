package com.planora.backend.service;

import com.planora.backend.dto.*;
import com.planora.backend.model.*;
import com.planora.backend.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldRepository customFieldRepository;
    private final TaskFieldValueRepository taskFieldValueRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamMemberRepository teamMemberRepository;

    public List<CustomFieldResponseDTO> getProjectCustomFields(Long projectId, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));
        validateMembership(project.getTeam().getId(), currentUserId);

        return customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(projectId).stream()
                .map(f -> new CustomFieldResponseDTO(
                        f.getId(),
                        f.getName(),
                        f.getFieldType(),
                        f.getOptions(),
                        f.getPosition()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomFieldResponseDTO createCustomField(Long projectId, CustomFieldRequestDTO dto, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));
        validateMembership(project.getTeam().getId(), currentUserId);

        CustomField field = new CustomField();
        field.setProject(project);
        field.setName(dto.getName());
        field.setFieldType(dto.getFieldType());
        field.setOptions(dto.getOptions());
        field.setPosition(dto.getPosition() != null ? dto.getPosition() : 0);
        field.setCreatedAt(LocalDateTime.now());

        CustomField saved = customFieldRepository.save(field);
        return new CustomFieldResponseDTO(
                saved.getId(),
                saved.getName(),
                saved.getFieldType(),
                saved.getOptions(),
                saved.getPosition()
        );
    }

    @Transactional
    public void deleteCustomField(Long projectId, Long fieldId, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));
        validateMembership(project.getTeam().getId(), currentUserId);

        CustomField field = customFieldRepository.findById(fieldId)
                .orElseThrow(() -> new EntityNotFoundException("Custom field not found"));

        if (!field.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Custom field does not belong to this project");
        }

        customFieldRepository.delete(field);
    }

    public List<TaskCustomFieldResponseDTO> getTaskCustomFields(Long taskId, Long currentUserId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        validateMembership(task.getProject().getTeam().getId(), currentUserId);

        List<CustomField> fields = customFieldRepository.findByProjectIdOrderByPositionAscIdAsc(task.getProject().getId());
        List<TaskFieldValue> values = taskFieldValueRepository.findByTaskId(taskId);

        Map<Long, String> valueMap = values.stream()
                .collect(Collectors.toMap(
                        v -> v.getCustomField().getId(),
                        TaskFieldValue::getValue,
                        (v1, v2) -> v1
                ));

        return fields.stream()
                .map(f -> new TaskCustomFieldResponseDTO(
                        f.getId(),
                        f.getName(),
                        f.getFieldType(),
                        f.getOptions(),
                        valueMap.getOrDefault(f.getId(), null)
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void patchTaskCustomField(Long taskId, TaskFieldValuePatchDTO dto, Long currentUserId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        validateMembership(task.getProject().getTeam().getId(), currentUserId);

        CustomField customField = customFieldRepository.findById(dto.getCustomFieldId())
                .orElseThrow(() -> new EntityNotFoundException("Custom field not found"));

        if (!customField.getProject().getId().equals(task.getProject().getId())) {
            throw new IllegalArgumentException("Custom field does not belong to the project of this task");
        }

        TaskFieldValue fieldValue = taskFieldValueRepository.findByTaskIdAndCustomFieldId(taskId, dto.getCustomFieldId())
                .orElseGet(() -> {
                    TaskFieldValue val = new TaskFieldValue();
                    val.setTask(task);
                    val.setCustomField(customField);
                    return val;
                });

        fieldValue.setValue(dto.getValue());
        taskFieldValueRepository.save(fieldValue);
    }

    private void validateMembership(Long teamId, Long userId) {
        teamMemberRepository.findByTeamIdAndUserUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this project"));
    }
}
