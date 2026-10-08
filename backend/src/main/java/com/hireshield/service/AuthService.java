package com.hireshield.service;

import com.hireshield.dto.*;
import com.hireshield.model.*;
import com.hireshield.model.enums.Role;
import com.hireshield.repository.*;
import com.hireshield.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final HiringTeamProfileRepository hiringTeamProfileRepository;
    private final ApplicantProfileRepository applicantProfileRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       HiringTeamProfileRepository hiringTeamProfileRepository,
                       ApplicantProfileRepository applicantProfileRepository,
                       OrganizationRepository organizationRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.hiringTeamProfileRepository = hiringTeamProfileRepository;
        this.applicantProfileRepository = applicantProfileRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse registerHiringTeam(HiringTeamRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create Organization
        Organization org = Organization.builder()
                .companyName(request.getCompanyName())
                .industry(request.getIndustry())
                .companySize(request.getCompanySize())
                .companyWebsite(request.getCompanyWebsite())
                .companyLocation(request.getCompanyLocation())
                .companyDescription(request.getCompanyDescription())
                .build();
        org = organizationRepository.save(org);

        // Create User
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.HIRING_TEAM)
                .active(true)
                .organizationId(org.getId())
                .build();
        user = userRepository.save(user);

        // Update org with creator
        org.setCreatedByUserId(user.getId());
        organizationRepository.save(org);

        // Create Hiring Team Profile
        HiringTeamProfile profile = HiringTeamProfile.builder()
                .userId(user.getId())
                .fullName(request.getFullName())
                .designation(request.getDesignation())
                .department(request.getDepartment())
                .yearsOfExperience(request.getYearsOfExperience())
                .bio(request.getBio())
                .organizationId(org.getId())
                .build();
        profile = hiringTeamProfileRepository.save(profile);

        // Update user with profile ID
        user.setProfileId(profile.getId());
        userRepository.save(user);

        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profileId(profile.getId())
                .organizationId(org.getId())
                .build();
    }

    public AuthResponse registerApplicant(ApplicantRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create User
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.APPLICANT)
                .active(true)
                .build();
        user = userRepository.save(user);

        // Create Applicant Profile
        ApplicantProfile profile = ApplicantProfile.builder()
                .userId(user.getId())
                .fullName(request.getFullName())
                .professionalTitle(request.getProfessionalTitle())
                .phone(request.getPhone())
                .location(request.getLocation())
                .education(request.getEducation())
                .skills(request.getSkills() != null ? request.getSkills() : new ArrayList<>())
                .yearsOfExperience(request.getYearsOfExperience())
                .professionalSummary(request.getProfessionalSummary())
                .certifications(request.getCertifications() != null ? request.getCertifications() : new ArrayList<>())
                .portfolioUrl(request.getPortfolioUrl())
                .githubUrl(request.getGithubUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .build();
        profile = applicantProfileRepository.save(profile);

        // Update user with profile ID
        user.setProfileId(profile.getId());
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profileId(profile.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profileId(user.getProfileId())
                .organizationId(user.getOrganizationId())
                .build();
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
