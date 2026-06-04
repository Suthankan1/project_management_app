package com.planora.backend.controller;

import com.planora.backend.dto.MovePageRequestDto;
import com.planora.backend.dto.PageDetailResponseDto;
import com.planora.backend.dto.PageRequestDto;
import com.planora.backend.dto.PageSummaryResponseDto;
import com.planora.backend.dto.PageVersionResponseDto;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.ProjectPageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectPageController {

    private final ProjectPageService service;

    @PostMapping("/projects/{projectId}/pages")
    public ResponseEntity<PageDetailResponseDto> createPage(
            @PathVariable Long projectId,
            @Valid @RequestBody PageRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.createPage(projectId, request, principal.getUserId()), HttpStatus.CREATED);
    }

    /*
     * Fetches a lightweight list of all pages for a project's sidebar navigation.
     * API DESIGN: By returning `PageSummaryResponseDto` instead of the full page entity,
     * we omit the heavy rich-text `content` field. This makes the API lightning fast
     * and saves massive amounts of mobile data for the end-user.
     */
    @GetMapping("/projects/{projectId}/pages")
    public ResponseEntity<List<PageSummaryResponseDto>> getPagesByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(
                service.getProjectPages(projectId, principal.getUserId()),
                HttpStatus.OK
        );
    }

    /*
     * Fetches the complete, rich-text content of a single page.
     * REST STANDARD: Uses flat routing (`/pages/{pageId}`) because the page ID alone
     * is enough to uniquely identify the resource in the database.
     */
    @GetMapping("/pages/{pageId}")
    public ResponseEntity<PageDetailResponseDto> getPage(
            @PathVariable Long pageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.getPageById(pageId, principal.getUserId()), HttpStatus.OK);
    }

    /*
     * Updates the title or content of an existing page.
     * REST STANDARD: Uses @PutMapping because this completely replaces the existing
     * title and content with the new values provided in the payload.
     */
    @PutMapping("/pages/{pageId}")
    public ResponseEntity<PageDetailResponseDto> updatePage(
            @PathVariable Long pageId,
            @Valid @RequestBody PageRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.updatePage(pageId, request, principal.getUserId()), HttpStatus.OK);
    }

    /*
     * Permanently deletes a documentation page.
     * REST STANDARD: Returns a 204 No Content status code upon success,
     * indicating the server fulfilled the request and there is no additional payload to send.
     */
    @DeleteMapping("/pages/{pageId}")
    public ResponseEntity<Void> deletePage(
            @PathVariable Long pageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        service.deletePage(pageId, principal.getUserId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PatchMapping("/projects/{projectId}/pages/{pageId}/star")
    public ResponseEntity<PageDetailResponseDto> toggleStar(
            @PathVariable Long projectId,
            @PathVariable Long pageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.toggleStar(projectId, pageId, principal.getUserId()), HttpStatus.OK);
    }

    @PatchMapping("/projects/{projectId}/pages/{pageId}/move")
    public ResponseEntity<PageDetailResponseDto> movePage(
            @PathVariable Long projectId,
            @PathVariable Long pageId,
            @RequestBody MovePageRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.movePage(projectId, pageId, request.getParentPageId(), principal.getUserId()), HttpStatus.OK);
    }

    @PostMapping("/projects/{projectId}/pages/{pageId}/viewed")
    public ResponseEntity<Void> markViewed(
            @PathVariable Long projectId,
            @PathVariable Long pageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        service.markViewed(projectId, pageId, principal.getUserId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/projects/{projectId}/pages/recent")
    public ResponseEntity<List<PageSummaryResponseDto>> getRecentPages(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(service.getRecentPages(projectId, principal.getUserId()), HttpStatus.OK);
    }

    @GetMapping("/projects/{projectId}/pages/{pageId}/versions")
    public ResponseEntity<List<PageVersionResponseDto>> getPageVersions(
            @PathVariable Long projectId,
            @PathVariable Long pageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(
                service.getPageVersions(projectId, pageId, principal.getUserId()),
                HttpStatus.OK
        );
    }

    @PostMapping("/projects/{projectId}/pages/{pageId}/versions/{versionId}/restore")
    public ResponseEntity<PageDetailResponseDto> restorePageVersion(
            @PathVariable Long projectId,
            @PathVariable Long pageId,
            @PathVariable Long versionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(
                service.restorePageVersion(projectId, pageId, versionId, principal.getUserId()),
                HttpStatus.OK
        );
    }

}
