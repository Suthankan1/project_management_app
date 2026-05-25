package com.planora.backend.controller;

import com.planora.backend.dto.PortfolioDTO;
import com.planora.backend.dto.PortfolioResponseDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping
    public ResponseEntity<PortfolioResponseDTO> create(
            @Valid @RequestBody PortfolioDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(
                portfolioService.createPortfolio(dto, principal.getUserId()),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PortfolioResponseDTO>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.getPortfoliosForUser(principal.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortfolioResponseDTO> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.getPortfolioById(id, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody PortfolioDTO dto) {
        return ResponseEntity.ok(portfolioService.updatePortfolio(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        portfolioService.deletePortfolio(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/{id}/projects/{projectId}")
    public ResponseEntity<PortfolioResponseDTO> addProject(
            @PathVariable Long id,
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.addProject(id, projectId, principal.getUserId()));
    }

    @DeleteMapping("/{id}/projects/{projectId}")
    public ResponseEntity<Void> removeProject(
            @PathVariable Long id,
            @PathVariable Long projectId) {
        portfolioService.removeProject(id, projectId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
