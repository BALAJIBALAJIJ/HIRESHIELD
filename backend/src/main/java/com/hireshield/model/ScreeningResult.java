package com.hireshield.model;

import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "screening_results")
public class ScreeningResult {

    @Id
    private String id;

    private String applicationId;
    private String jobId;
    private String applicantUserId;

    // Overall Result
    private ApplicationStatus recommendedStatus;
    private double overallScore;
    private String overallExplanation;

    // Detailed Score Breakdown
    private double skillsMatchScore;
    private double experienceMatchScore;
    private double qualificationMatchScore;
    private double mandatoryScore;
    private double preferredScore;
    private double answerRelevanceScore;
    private double profileResumeConsistencyScore;
    private double crossValidationScore;

    // Detailed Breakdown
    @Builder.Default
    private List<CriterionResult> criteriaResults = new ArrayList<>();

    // Skills Analysis
    @Builder.Default
    private List<String> matchedSkills = new ArrayList<>();
    @Builder.Default
    private List<String> missingSkills = new ArrayList<>();

    // Resume AI Analysis
    private ContentRiskLevel resumeContentRisk;
    private double resumeAiConfidence;
    private String resumeAnalysisDetails;

    // AI Content Risk
    private ContentRiskLevel aiContentRisk;
    private String aiContentExplanation;

    // Resume Authenticity
    private String resumeAuthenticityRisk;
    private String resumeAuthenticityExplanation;

    // Profile-Resume Consistency
    @Builder.Default
    private List<Map<String, Object>> inconsistencies = new ArrayList<>();

    // Cross-Validation
    @Builder.Default
    private List<Map<String, Object>> contradictions = new ArrayList<>();
    private String crossValidationAssessment;

    // Answer Analysis Results
    @Builder.Default
    private List<Map<String, Object>> answerAnalyses = new ArrayList<>();

    // Failed Requirements
    @Builder.Default
    private List<String> failedRequirements = new ArrayList<>();

    // Warnings
    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    // Reasons
    @Builder.Default
    private List<String> reasons = new ArrayList<>();

    // Parsed Resume Data
    private Map<String, Object> parsedResumeData;

    // Human Review
    private boolean needsHumanReview;
    private String humanReviewDecision;
    private String humanReviewedByUserId;
    private LocalDateTime humanReviewedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CriterionResult {
        private String category;
        private String requirement;
        private String type;       // MANDATORY or PREFERRED
        private boolean satisfied;
        private String explanation;
        private double confidence;
    }
}
