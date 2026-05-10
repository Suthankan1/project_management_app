package com.planora.backend.controller;

import com.planora.backend.dto.KanbanColumnRequestDTO;
import com.planora.backend.dto.KanbanColumnSettingsDTO;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.service.KanbanColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*REST Controller for managing Kanban board columns.
 Handles column lifecycle, positioning, and configuration settings.*/
@RestController
@RequestMapping("/api/kanban-columns")
public class KanbanColumnController {

    @Autowired
    private KanbanColumnService kanbanColumnService;

    //create column
    @PostMapping
    public ResponseEntity<KanbanColumn> createKanbanColumn(@RequestBody KanbanColumnRequestDTO dto) {
        return ResponseEntity.ok(kanbanColumnService.createKanbanColumn(dto));
    }

    //Retrieves all columns associated with a specific board, ordered by position.
    @GetMapping("/kanban/{kanbanId}")
    public ResponseEntity<List<KanbanColumn>> getColumnsByKanbanId(@PathVariable Long kanbanId) {
        return ResponseEntity.ok(kanbanColumnService.getColumnsByKanbanId(kanbanId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KanbanColumn> getKanbanColumnById(@PathVariable Long id) {
        return kanbanColumnService.getKanbanColumnById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //update column
    @PutMapping("/{id}")
    public ResponseEntity<KanbanColumn> updateKanbanColumn(@PathVariable Long id, @RequestBody KanbanColumnRequestDTO dto) {
        return ResponseEntity.ok(kanbanColumnService.updateKanbanColumn(id, dto));
    }

    //delete column
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKanbanColumn(@PathVariable Long id) {
        kanbanColumnService.deleteKanbanColumn(id);
        return ResponseEntity.noContent().build();
    }

    // Updates the display order of columns.
    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderColumns(@RequestBody List<Map<String, Integer>> reorderRequest) {
        kanbanColumnService.reorderColumns(reorderRequest);
        return ResponseEntity.noContent().build();
    }

    // Rename a column
    @PatchMapping("/{id}/rename")
    public ResponseEntity<KanbanColumn> renameColumn(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(kanbanColumnService.renameColumn(id, body.get("name")));
    }

    //Updates UI-specific settings like Work-In-Progress (WIP) limits and column themes.
    @PatchMapping("/{id}/settings")
    public ResponseEntity<KanbanColumn> updateColumnSettings(
            @PathVariable Long id,
            @RequestBody KanbanColumnSettingsDTO dto) {
        return ResponseEntity.ok(kanbanColumnService.updateColumnSettings(id, dto));
    }
}
