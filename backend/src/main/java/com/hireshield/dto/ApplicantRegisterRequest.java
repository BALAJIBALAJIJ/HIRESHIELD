package com.hireshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantRegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$", message = "Only Gmail addresses are accepted")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Professional title is required")
    private String professionalTitle;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Education is required")
    private String education;

    @NotEmpty(message = "At least one skill is required")
    private List<String> skills;

    @Min(value = 0, message = "Experience cannot be negative")
    @Max(value = 80, message = "Experience cannot exceed 80 years")
    private int yearsOfExperience;

    private String professionalSummary;

    private List<String> certifications;

    private String portfolioUrl;

    @Pattern(regexp = "^$|^https?://(www\\.)?github\\.com/[a-zA-Z0-9_-]+/?$",
             message = "Enter a valid GitHub URL (e.g., https://github.com/username)")
    private String githubUrl;

    @Pattern(regexp = "^$|^https?://(www\\.)?linkedin\\.com/in/[a-zA-Z0-9_-]+/?$",
             message = "Enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)")
    private String linkedinUrl;
}
