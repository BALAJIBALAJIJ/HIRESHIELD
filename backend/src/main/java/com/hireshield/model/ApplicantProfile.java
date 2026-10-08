package com.hireshield.model;

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
@Document(collection = "applicant_profiles")
public class ApplicantProfile {

    @Id
    private String id;

    private String userId;

    private String fullName;
    private String professionalTitle;
    private String phone;
    private String location;
    private String education;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    private int yearsOfExperience;
    private String professionalSummary;

    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String profilePhotoUrl;
    private String resumeUrl;
    private String resumeFileName;
    private String resumePublicId;  // Cloudinary public ID for management

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
