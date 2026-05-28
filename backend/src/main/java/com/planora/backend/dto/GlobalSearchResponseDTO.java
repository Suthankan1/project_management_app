package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalSearchResponseDTO {
    private List<TaskSearchResultDTO> tasks;
    private List<DocumentSearchResultDTO> documents;
    private List<MemberSearchResultDTO> members;
    private List<ProjectSearchResultDTO> projects;
    private List<MessageSearchResultDTO> messages;

    public enum SearchResultType {
        TASK,
        DOCUMENT,
        MEMBER,
        PROJECT,
        MESSAGE
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSearchResultDTO {
        private Long id;
        private String title;
        private String subtitle;
        private String projectName;
        private String status;
        private String url;
        private SearchResultType type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentSearchResultDTO {
        private Long id;
        private String title;
        private String subtitle;
        private String url;
        private SearchResultType type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberSearchResultDTO {
        private Long id;
        private String name;
        private String subtitle;
        private String url;
        private SearchResultType type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectSearchResultDTO {
        private Long id;
        private String title;
        private String subtitle;
        private String url;
        private SearchResultType type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageSearchResultDTO {
        private Long messageId;
        private String highlightedContent;
        private String senderName;
        private String timestamp;
        private Long roomOrProjectId;
        private Long projectId;
        private Long roomId;
        private String deepLinkUrl;
        private SearchResultType type;
    }
}
