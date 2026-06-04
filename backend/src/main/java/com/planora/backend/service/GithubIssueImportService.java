package com.planora.backend.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubIssueImportRequestDTO;
import com.planora.backend.dto.GithubIssueImportResponseDTO;
import com.planora.backend.exception.ForbiddenException;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubIssueImportService {

    private final GithubIssuesSyncService githubIssuesSyncService;

    private final ProjectRepository projectRepository;

    private final TaskRepository taskRepository;

    private final TeamMembershipLookupService teamMembershipLookupService;

    private final GithubIssueConversionService githubIssueConversionService;

    private final GithubTokenService githubTokenService;

    @Transactional
    public GithubIssueImportResponseDTO importIssues(GithubIssueImportRequestDTO request, User currentUser) {
        return importIssues(request, currentUser, null);
    }

    @Transactional
    public GithubIssueImportResponseDTO importIssues(
            GithubIssueImportRequestDTO request,
            User currentUser,
            String requestGithubToken
    ) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        TeamMember member = teamMembershipLookupService.getTeamMember(
                project.getTeam().getId(), currentUser.getUserId());
        if (member == null) {
            throw new ForbiddenException("User is not a member of this project");
        }

        String token = requestGithubToken == null || requestGithubToken.isBlank()
                ? githubTokenService.getToken(currentUser.getUserId())
                : requestGithubToken;
        if (token == null || token.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }

        List<GithubIssueDTO> issues = githubIssuesSyncService.syncIssues(request.getRepoFullName(), token);
        var issuesByNumber = issues.stream()
                .filter(issue -> issue.getNumber() != null)
                .collect(Collectors.toMap(GithubIssueDTO::getNumber, Function.identity(), (first, duplicate) -> first));

        long nextProjectTaskNumber = taskRepository.findMaxProjectTaskNumberByProjectId(project.getId()) + 1L;
        int nextBacklogPosition = taskRepository.findMaxBacklogPositionByProjectId(project.getId()) + 1;
        List<Long> imported = new ArrayList<>();
        List<Integer> skipped = new ArrayList<>();
        Set<Integer> handledNumbers = new HashSet<>();

        for (Integer issueNumber : request.getIssueNumbers()) {
            if (issueNumber == null
                    || !handledNumbers.add(issueNumber)
                    || githubIssueConversionService.isAlreadyImported(
                            issueNumber.longValue(), request.getRepoFullName(), project.getId())) {
                skipped.add(issueNumber);
                continue;
            }

            GithubIssueDTO issue = issuesByNumber.get(issueNumber);
            if (issue == null) {
                skipped.add(issueNumber);
                continue;
            }

            Task task = githubIssueConversionService.convertIssueToTask(issue, project);
            task.setProjectTaskNumber(nextProjectTaskNumber++);
            task.setBacklogPosition(nextBacklogPosition++);
            task.setReporter(member);
            task.setLastModifiedBy(currentUser);

            Task saved = taskRepository.save(task);
            imported.add(saved.getId());
        }

        return new GithubIssueImportResponseDTO(imported, skipped);
    }
}
