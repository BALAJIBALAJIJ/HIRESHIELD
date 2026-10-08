package com.hireshield.model;

import com.hireshield.model.enums.EmploymentType;
import com.hireshield.model.enums.RequirementType;
import com.hireshield.model.enums.WorkMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "jobs")
public class Job {

    @Id
    private String id;

    // Job Details
    private String title;
    private String description;

    @Builder.Default
    private List<String> requiredSkills = new ArrayList<>();

    private String requiredExperience;
    private String requiredQualification;
    private String location;
    private WorkMode workMode;
    private String salary;
    private EmploymentType employmentType;
    private int numberOfOpenings;
    private LocalDate applicationDeadline;

    // Screening Criteria
    @Builder.Default
    private List<ScreeningCriterion> screeningCriteria = new ArrayList<>();

    // Screening Questions
    @Builder.Default
    private List<String> screeningQuestionIds = new ArrayList<>();

    // Organization & Publisher
    private String organizationId;
    private String publishedByUserId;

    // Status
    private boolean active;
    private boolean published;

    // Stats (denormalized for dashboard performance)
    @Builder.Default
    private int totalApplications = 0;
    @Builder.Default
    private int eligibleApplications = 0;
    @Builder.Default
    private int rejectedApplications = 0;
    @Builder.Default
    private int shortlistedApplications = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScreeningCriterion {
        private String category;        // e.g., "Programming Language", "Degree", "Certification"
        private String requirement;     // e.g., "Java", "B.E/B.Tech", "AWS Certified"
        private RequirementType type;   // MANDATORY or PREFERRED
        private String description;     // Optional additional context
    }
}
