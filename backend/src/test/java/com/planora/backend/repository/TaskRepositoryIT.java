package com.planora.backend.repository;

import com.planora.backend.BaseIntegrationIT;
import com.planora.backend.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
class TaskRepositoryIT extends BaseIntegrationIT {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    void removeFromTaskAssignees_removesMemberFromTaskAssigneesSuccessfully() {
        User owner = new User();
        owner.setEmail("owner@planora.com");
        owner.setUsername("owner");
        owner.setPassword("HashedPass123!");
        owner.setVerified(true);
        owner = userRepository.save(owner);

        User assigneeUser = new User();
        assigneeUser.setEmail("assignee@planora.com");
        assigneeUser.setUsername("assignee");
        assigneeUser.setPassword("HashedPass123!");
        assigneeUser.setVerified(true);
        assigneeUser = userRepository.save(assigneeUser);

        Team team = new Team();
        team.setName("Integration Team");
        team.setOwner(owner);
        team = teamRepository.save(team);

        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setUser(assigneeUser);
        member.setRole(TeamRole.MEMBER);
        member = teamMemberRepository.save(member);

        Project project = new Project();
        project.setName("Integration Project");
        project.setProjectKey("INT-1");
        project.setOwner(owner);
        project.setType(ProjectType.KANBAN);
        project.setTeam(team);
        project = projectRepository.save(project);

        Task task = new Task();
        task.setTitle("Integration Task");
        task.setProject(project);
        task.setStatus("TODO");
        task.getAssignees().add(member);
        task = taskRepository.save(task);

        Optional<Task> loadedTaskBefore = taskRepository.findById(task.getId());
        assertTrue(loadedTaskBefore.isPresent());
        assertEquals(1, loadedTaskBefore.get().getAssignees().size());

        taskRepository.removeFromTaskAssignees(member.getId());

        taskRepository.flush();

        Optional<Task> loadedTaskAfter = taskRepository.findById(task.getId());
        assertTrue(loadedTaskAfter.isPresent());
        assertTrue(loadedTaskAfter.get().getAssignees().isEmpty());
    }
}
