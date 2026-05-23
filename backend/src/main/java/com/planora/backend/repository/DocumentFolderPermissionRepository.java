package com.planora.backend.repository;

import com.planora.backend.model.DocumentFolderPermission;
import com.planora.backend.model.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentFolderPermissionRepository extends JpaRepository<DocumentFolderPermission, Long> {
    List<DocumentFolderPermission> findByFolderIdAndTeamRole(Long folderId, TeamRole role);

    boolean existsByFolderIdAndTeamRoleAndPermission(Long folderId, TeamRole role, String permission);

    void deleteByFolderIdAndTeamRole(Long folderId, TeamRole role);
}
