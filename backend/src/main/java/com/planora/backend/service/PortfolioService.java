package com.planora.backend.service;

import com.planora.backend.dto.PortfolioDTO;
import com.planora.backend.dto.PortfolioResponseDTO;
import com.planora.backend.dto.ProjectMetricsDTO;
import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.Portfolio;
import com.planora.backend.model.Project;
import com.planora.backend.model.User;
import com.planora.backend.repository.PortfolioRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    @Transactional
    public PortfolioResponseDTO createPortfolio(PortfolioDTO dto, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Portfolio portfolio = new Portfolio();
        portfolio.setName(dto.getName());
        portfolio.setDescription(dto.getDescription());
        portfolio.setColor(dto.getColor() != null ? dto.getColor() : "#155DFC");
        portfolio.setEmoji(dto.getEmoji());
        portfolio.setOwner(owner);
        if (dto.getProjectIds() != null && !dto.getProjectIds().isEmpty()) {
            portfolio.setProjects(projectRepository.findAllById(dto.getProjectIds()));
        }
        return toSummaryDTO(portfolioRepository.save(portfolio));
    }

    @Transactional(readOnly = true)
    public List<PortfolioResponseDTO> getPortfoliosForUser(Long userId) {
        return portfolioRepository.findByOwner_UserId(userId)
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PortfolioResponseDTO getPortfolioById(Long id, Long userId) {
        Portfolio portfolio = portfolioRepository.findByIdWithProjects(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found: " + id));
        return toDetailDTO(portfolio, userId);
    }

    @Transactional
    public PortfolioResponseDTO updatePortfolio(Long id, PortfolioDTO dto) {
        Portfolio portfolio = portfolioRepository.findByIdWithProjects(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found: " + id));
        if (dto.getName() != null) portfolio.setName(dto.getName());
        if (dto.getDescription() != null) portfolio.setDescription(dto.getDescription());
        if (dto.getColor() != null) portfolio.setColor(dto.getColor());
        if (dto.getEmoji() != null) portfolio.setEmoji(dto.getEmoji());
        if (dto.getProjectIds() != null) {
            portfolio.setProjects(projectRepository.findAllById(dto.getProjectIds()));
        }
        return toSummaryDTO(portfolioRepository.save(portfolio));
    }

    @Transactional
    public void deletePortfolio(Long id) {
        if (!portfolioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Portfolio not found: " + id);
        }
        portfolioRepository.deleteById(id);
    }

    @Transactional
    public PortfolioResponseDTO addProject(Long portfolioId, Long projectId, Long userId) {
        Portfolio portfolio = portfolioRepository.findByIdWithProjects(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found: " + portfolioId));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        boolean exists = portfolio.getProjects().stream().anyMatch(p -> p.getId().equals(projectId));
        if (!exists) {
            portfolio.getProjects().add(project);
            portfolioRepository.save(portfolio);
        }
        return toDetailDTO(portfolio, userId);
    }

    @Transactional
    public void removeProject(Long portfolioId, Long projectId) {
        Portfolio portfolio = portfolioRepository.findByIdWithProjects(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found: " + portfolioId));
        portfolio.getProjects().removeIf(p -> p.getId().equals(projectId));
        portfolioRepository.save(portfolio);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private PortfolioResponseDTO toSummaryDTO(Portfolio p) {
        long totalTasks = 0, completedTasks = 0, overdueTasks = 0, totalMembers = 0;
        for (Project proj : p.getProjects()) {
            try {
                ProjectMetricsDTO m = projectService.getProjectMetrics(proj.getId());
                totalTasks     += m.getTotalTasks()     != null ? m.getTotalTasks()     : 0;
                completedTasks += m.getCompletedTasks() != null ? m.getCompletedTasks() : 0;
                overdueTasks   += m.getOverdueTasks()   != null ? m.getOverdueTasks()   : 0;
                totalMembers   += m.getMemberCount()    != null ? m.getMemberCount()    : 0;
            } catch (Exception ignored) {}
        }
        return PortfolioResponseDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .color(p.getColor())
                .emoji(p.getEmoji())
                .ownerId(p.getOwner() != null ? p.getOwner().getUserId() : null)
                .ownerName(p.getOwner() != null ? p.getOwner().getUsername() : null)
                .projectCount(p.getProjects().size())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .totalMembers(totalMembers)
                .healthScore(healthScore(totalTasks, completedTasks, overdueTasks))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private PortfolioResponseDTO toDetailDTO(Portfolio p, Long userId) {
        List<ProjectResponseDTO> projectDTOs = p.getProjects().stream()
                .map(proj -> ProjectResponseDTO.builder()
                        .id(proj.getId())
                        .name(proj.getName())
                        .projectKey(proj.getProjectKey())
                        .description(proj.getDescription())
                        .type(proj.getType())
                        .createdAt(proj.getCreatedAt())
                        .updatedAt(proj.getUpdatedAt())
                        .ownerId(proj.getOwner() != null ? proj.getOwner().getUserId() : null)
                        .ownerName(proj.getOwner() != null ? proj.getOwner().getUsername() : null)
                        .teamId(proj.getTeam() != null ? proj.getTeam().getId() : null)
                        .teamName(proj.getTeam() != null ? proj.getTeam().getName() : null)
                        .build())
                .collect(Collectors.toList());

        long totalTasks = 0, completedTasks = 0, overdueTasks = 0, totalMembers = 0;
        for (Project proj : p.getProjects()) {
            try {
                ProjectMetricsDTO m = projectService.getProjectMetrics(proj.getId());
                totalTasks     += m.getTotalTasks()     != null ? m.getTotalTasks()     : 0;
                completedTasks += m.getCompletedTasks() != null ? m.getCompletedTasks() : 0;
                overdueTasks   += m.getOverdueTasks()   != null ? m.getOverdueTasks()   : 0;
                totalMembers   += m.getMemberCount()    != null ? m.getMemberCount()    : 0;
            } catch (Exception ignored) {}
        }

        return PortfolioResponseDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .color(p.getColor())
                .emoji(p.getEmoji())
                .ownerId(p.getOwner() != null ? p.getOwner().getUserId() : null)
                .ownerName(p.getOwner() != null ? p.getOwner().getUsername() : null)
                .projectCount(p.getProjects().size())
                .projects(projectDTOs)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .totalMembers(totalMembers)
                .healthScore(healthScore(totalTasks, completedTasks, overdueTasks))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private int healthScore(long total, long completed, long overdue) {
        if (total == 0) return 100;
        double cr = (double) completed / total;
        double or_ = (double) overdue / total;
        return (int) Math.max(0, Math.min(100, cr * 70 + (1 - or_) * 30));
    }
}
