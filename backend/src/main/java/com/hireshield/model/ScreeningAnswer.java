package com.hireshield.model;

import com.hireshield.model.enums.ContentRiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "screening_answers")
public class ScreeningAnswer {

    @Id
    private String id;

    private String applicationId;
    private String questionId;
    private String jobId;
    private String applicantUserId;

    private String question;
    private String answer;

    // AI Analysis
    private double relevanceScore;          // 0-100 how relevant the answer is
    private ContentRiskLevel aiContentRisk; // AI-generated content risk
    private double aiConfidence;            // 0-1 confidence of AI detection
    private String evaluationStatus;        // RELEVANT, IRRELEVANT, NEEDS_REVIEW
    private String evaluationExplanation;

    @CreatedDate
    private LocalDateTime createdAt;
}
