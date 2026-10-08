package com.hireshield.model;

import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "applications")
public class Application {

    @Id
    private String id;

    private String jobId;
    private String applicantUserId;
    private String applicantProfileId;
    private String organizationId;

    // Resume
    private String resumeUrl;
    private String resumeFileName;
    private String resumePublicId;

    // Status
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    // Match Score
    private MatchScore matchScore;

    // AI Content Analysis
    private ContentRiskLevel resumeContentRisk;
    private double resumeAiConfidence;

    // Screening Result Summary
    private String screeningResultId;
    private String rejectionReason;
    private String eligibilityExplanation;

    // Internal Notes (by hiring team)
    @Builder.Default
    private List<InternalNote> internalNotes = new ArrayList<>();

    // Status History
    @Builder.Default
    private List<StatusChange> statusHistory = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchScore {
        private double overall;
        private double skillsMatch;
        private double experienceMatch;
        private double qualificationMatch;
        private double mandatoryCriteriaMatch;
        private double jobRelevance;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InternalNote {
        private String note;
        private String addedByUserId;
        private String addedByName;
        private LocalDateTime addedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusChange {
        private ApplicationStatus fromStatus;
        private ApplicationStatus toStatus;
        private String changedByUserId;
        private String reason;
        private LocalDateTime changedAt;
    }
}
