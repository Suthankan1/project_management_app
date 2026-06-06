package com.planora.backend.repository;


import com.planora.backend.model.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/*Repository interface for KanbanColumn persistence.
 Provides specialized queries for board layout and ordering logic.*/
@Repository
public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, Long> {

    /*Retrieves all columns for a specific board, sorted by their 'position' index.
     Used primarily for initial board rendering on the frontend.*/
    List<KanbanColumn> findByKanbanIdOrderByPosition(Long kanbanId);

    Optional<KanbanColumn> findFirstByKanban_ProjectIdAndNameIgnoreCase(Long projectId, String name);

    //Efficiently updates only the position of a column.
    //Used during drag-and-drop reordering to minimize database overhead.
    @Modifying
    @Query("UPDATE KanbanColumn c SET c.position = :position WHERE c.id = :id")
    void updatePosition(@Param("id") Long id, @Param("position") Integer position);
}
