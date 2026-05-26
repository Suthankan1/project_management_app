package com.planora.backend.service;

import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.planora.backend.dto.GithubCommentDTO;
import com.planora.backend.dto.GithubCommentSyncResponseDTO;
import com.planora.backend.exception.ConflictException;
import com.planora.backend.exception.ForbiddenException;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.Comment;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.model.User;
import com.planora.backend.repository.CommentRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;

@Service
public class GithubIssueCommentSyncService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TeamMembershipLookupService teamMembershipLookupService;

    @Autowired
    private GithubIssuesSyncService githubIssuesSyncService;

    @Transactional
    public GithubCommentSyncResponseDTO syncComments(Long projectId, int issueNumber, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (teamMembershipLookupService.getTeamMember(project.getTeam().getId(), currentUser.getUserId()) == null) {
            throw new ForbiddenException("User is not a member of this project");
        }

        String accessToken = currentUser.getGithubAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }

        List<Task> importedTasks = taskRepository.findByProjectIdAndGithubIssueNumber(
                projectId, (long) issueNumber);
        if (importedTasks.isEmpty()) {
            throw new ResourceNotFoundException("Imported GitHub task not found");
        }
        if (importedTasks.size() > 1) {
            throw new ConflictException("Multiple imported repositories contain this issue number");
        }

        Task task = importedTasks.get(0);
        if (task.getGithubRepoFullName() == null || task.getGithubRepoFullName().isBlank()) {
            throw new ResourceNotFoundException("Imported task does not reference a GitHub repository");
        }

        Set<String> existingContents = new HashSet<>();
        commentRepository.findByTaskOrderByCreatedAtAsc(task).stream()
                .map(Comment::getContent)
                .forEach(existingContents::add);

        List<GithubCommentDTO> githubComments = githubIssuesSyncService.fetchIssueComments(
                task.getGithubRepoFullName(), issueNumber, accessToken);
        int synced = 0;
        for (GithubCommentDTO githubComment : githubComments) {
            String content = githubContent(githubComment);
            if (!existingContents.add(content)) {
                continue;
            }
            Comment comment = new Comment();
            comment.setTask(task);
            comment.setAuthor(currentUser);
            comment.setContent(content);
            if (githubComment.getCreatedAt() != null) {
                comment.setCreatedAt(githubComment.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDateTime());
            }
            commentRepository.save(comment);
            synced++;
        }

        if (synced > 0) {
            task.setLastModifiedBy(currentUser);
            taskRepository.save(task);
        }
        return new GithubCommentSyncResponseDTO(synced);
    }

    private String githubContent(GithubCommentDTO comment) {
        String login = comment.getUserLogin() == null || comment.getUserLogin().isBlank()
                ? "unknown"
                : comment.getUserLogin();
        String body = comment.getBody() == null ? "" : comment.getBody();
        return "**[@" + login + " on GitHub]** " + body;
    }
}
