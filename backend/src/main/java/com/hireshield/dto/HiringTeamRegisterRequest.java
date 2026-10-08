package com.hireshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HiringTeamRegisterRequest {
    @NotBlank private String fullName;
    @NotBlank private String email;
    @NotBlank private String password;
    private String designation;
    private String department;
    private int yearsOfExperience;
    private String bio;
    private String companyName;
    private String industry;
    private String companySize;
    private String companyWebsite;
    private String companyLocation;
    private String companyDescription;
}
