package com.hireshield.controller;

import com.hireshield.dto.ApiResponse;
import com.hireshield.model.*;
import com.hireshield.repository.*;
import com.hireshield.service.AuthService;
import com.hireshield.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final AuthService authService;
    private final HiringTeamProfileRepository hiringTeamProfileRepository;
    private final ApplicantProfileRepository applicantProfileRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public ProfileController(AuthService authService,
                             HiringTeamProfileRepository hiringTeamProfileRepository,
                             ApplicantProfileRepository applicantProfileRepository,
                             OrganizationRepository organizationRepository,
                             UserRepository userRepository,
                             CloudinaryService cloudinaryService) {
        this.authService = authService;
        this.hiringTeamProfileRepository = hiringTeamProfileRepository;
        this.applicantProfileRepository = applicantProfileRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> profileData = new HashMap<>();
        profileData.put("user", user);

        switch (user.getRole()) {
            case HIRING_TEAM -> {
                hiringTeamProfileRepository.findByUserId(user.getId())
                        .ifPresent(p -> profileData.put("profile", p));
                if (user.getOrganizationId() != null) {
                    organizationRepository.findById(user.getOrganizationId())
                            .ifPresent(o -> profileData.put("organization", o));
                }
            }
            case APPLICANT -> {
                applicantProfileRepository.findByUserId(user.getId())
                        .ifPresent(p -> profileData.put("profile", p));
            }
            default -> {}
        }

        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profileData));
    }

    @PutMapping("/applicant")
    public ResponseEntity<ApiResponse> updateApplicantProfile(
            @RequestBody ApplicantProfile updates,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        ApplicantProfile profile = applicantProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getProfessionalTitle() != null) profile.setProfessionalTitle(updates.getProfessionalTitle());
        if (updates.getPhone() != null) profile.setPhone(updates.getPhone());
        if (updates.getLocation() != null) profile.setLocation(updates.getLocation());
        if (updates.getEducation() != null) profile.setEducation(updates.getEducation());
        if (updates.getSkills() != null) profile.setSkills(updates.getSkills());
        if (updates.getYearsOfExperience() > 0) profile.setYearsOfExperience(updates.getYearsOfExperience());
        if (updates.getProfessionalSummary() != null) profile.setProfessionalSummary(updates.getProfessionalSummary());
        if (updates.getCertifications() != null) profile.setCertifications(updates.getCertifications());
        if (updates.getPortfolioUrl() != null) profile.setPortfolioUrl(updates.getPortfolioUrl());
        if (updates.getGithubUrl() != null) profile.setGithubUrl(updates.getGithubUrl());
        if (updates.getLinkedinUrl() != null) profile.setLinkedinUrl(updates.getLinkedinUrl());

        profile = applicantProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    @PutMapping("/hiring-team")
    public ResponseEntity<ApiResponse> updateHiringTeamProfile(
            @RequestBody HiringTeamProfile updates,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        HiringTeamProfile profile = hiringTeamProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getDesignation() != null) profile.setDesignation(updates.getDesignation());
        if (updates.getDepartment() != null) profile.setDepartment(updates.getDepartment());
        if (updates.getYearsOfExperience() > 0) profile.setYearsOfExperience(updates.getYearsOfExperience());
        if (updates.getBio() != null) profile.setBio(updates.getBio());

        profile = hiringTeamProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    @PutMapping("/organization")
    public ResponseEntity<ApiResponse> updateOrganization(
            @RequestBody Organization updates,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Organization org = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        if (updates.getCompanyName() != null) org.setCompanyName(updates.getCompanyName());
        if (updates.getIndustry() != null) org.setIndustry(updates.getIndustry());
        if (updates.getCompanySize() != null) org.setCompanySize(updates.getCompanySize());
        if (updates.getCompanyWebsite() != null) org.setCompanyWebsite(updates.getCompanyWebsite());
        if (updates.getCompanyLocation() != null) org.setCompanyLocation(updates.getCompanyLocation());
        if (updates.getCompanyDescription() != null) org.setCompanyDescription(updates.getCompanyDescription());

        org = organizationRepository.save(org);
        return ResponseEntity.ok(ApiResponse.success("Organization updated", org));
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<ApiResponse> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = authService.getCurrentUser(userDetails.getUsername());
            Map<String, String> result = cloudinaryService.uploadProfilePhoto(file);

            if (user.getRole() == com.hireshield.model.enums.Role.APPLICANT) {
                ApplicantProfile profile = applicantProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new RuntimeException("Profile not found"));
                profile.setProfilePhotoUrl(result.get("url"));
                applicantProfileRepository.save(profile);
            } else {
                HiringTeamProfile profile = hiringTeamProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new RuntimeException("Profile not found"));
                profile.setProfilePhotoUrl(result.get("url"));
                hiringTeamProfileRepository.save(profile);
            }

            return ResponseEntity.ok(ApiResponse.success("Photo uploaded", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<ApiResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = authService.getCurrentUser(userDetails.getUsername());
            Map<String, String> result = cloudinaryService.uploadResume(file);

            ApplicantProfile profile = applicantProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Profile not found"));
            profile.setResumeUrl(result.get("url"));
            profile.setResumePublicId(result.get("public_id"));
            profile.setResumeFileName(file.getOriginalFilename());
            applicantProfileRepository.save(profile);

            return ResponseEntity.ok(ApiResponse.success("Resume uploaded", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-logo")
    public ResponseEntity<ApiResponse> uploadCompanyLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = authService.getCurrentUser(userDetails.getUsername());
            Map<String, String> result = cloudinaryService.uploadCompanyLogo(file);

            Organization org = organizationRepository.findById(user.getOrganizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
            org.setCompanyLogoUrl(result.get("url"));
            org.setCompanyLogoPublicId(result.get("public_id"));
            organizationRepository.save(org);

            return ResponseEntity.ok(ApiResponse.success("Logo uploaded", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }
}
