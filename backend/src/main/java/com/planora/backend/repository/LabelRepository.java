package com.planora.backend.repository;

import com.planora.backend.model.Label;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<Label, Long> {
    java.util.List<Label> findByProjectId(Long projectId);

    Optional<Label> findFirstByProjectIdAndNameIgnoreCaseAndColor(Long projectId, String name, String color);

    Optional<Label> findFirstByProjectIdAndNameIgnoreCase(Long projectId, String name);
}
