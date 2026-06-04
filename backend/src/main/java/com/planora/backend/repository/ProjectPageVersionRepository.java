package com.planora.backend.repository;

import com.planora.backend.model.ProjectPageVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectPageVersionRepository extends JpaRepository<ProjectPageVersion, Long> {
    List<ProjectPageVersion> findByPageIdOrderByVersionNumberDesc(Long pageId);
    ProjectPageVersion findFirstByPageIdOrderByVersionNumberDesc(Long pageId);
}
