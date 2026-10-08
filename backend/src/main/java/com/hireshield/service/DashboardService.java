package com.hireshield.service;

import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.repository.*;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final OrganizationRepository organizationRepository;

    public DashboardService(JobRepository jobRepository,
                            ApplicationRepository applicationRepository,
                            OrganizationRepository organizationRepository) {
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.organizationRepository = organizationRepository;
    }

    public Map<String, Object> getHiringTeamDashboard(String organizationId) {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        var org = organizationRepository.findById(organizationId).orElse(null);
        if (org != null) {
            dashboard.put("companyName", org.getCompanyName());
            dashboard.put("companyLogoUrl", org.getCompanyLogoUrl());
        }

        dashboard.put("totalJobs", jobRepository.findByOrganizationId(organizationId).size());
        dashboard.put("activeJobs", jobRepository.countByOrganizationIdAndActiveTrue(organizationId));
        dashboard.put("totalApplications", applicationRepository.countByOrganizationId(organizationId));
        dashboard.put("eligibleApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.ELIGIBLE));
        dashboard.put("rejectedApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.REJECTED));
        dashboard.put("shortlistedApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.SHORTLISTED));
        dashboard.put("interviewApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.INTERVIEW));
        dashboard.put("needsReviewApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.NEEDS_REVIEW));
        dashboard.put("selectedApplications", applicationRepository.countByOrganizationIdAndStatus(organizationId, ApplicationStatus.SELECTED));

        // Recent applications
        var recentApps = applicationRepository.findByOrganizationId(organizationId);
        recentApps.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        dashboard.put("recentApplications", recentApps.stream().limit(10).toList());

        // Active jobs
        dashboard.put("activeJobsList", jobRepository.findByOrganizationIdAndActiveTrue(organizationId));

        return dashboard;
    }

    public Map<String, Object> getApplicantDashboard(String applicantUserId) {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        dashboard.put("totalApplications", applicationRepository.countByApplicantUserId(applicantUserId));
        dashboard.put("appliedCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.APPLIED));
        dashboard.put("screeningCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.SCREENING));
        dashboard.put("eligibleCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.ELIGIBLE));
        dashboard.put("rejectedCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.REJECTED));
        dashboard.put("shortlistedCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.SHORTLISTED));
        dashboard.put("interviewCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.INTERVIEW));
        dashboard.put("selectedCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.SELECTED));
        dashboard.put("needsReviewCount", applicationRepository.countByApplicantUserIdAndStatus(applicantUserId, ApplicationStatus.NEEDS_REVIEW));

        // Recent applications
        var apps = applicationRepository.findByApplicantUserId(applicantUserId);
        apps.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        dashboard.put("recentApplications", apps.stream().limit(10).toList());

        return dashboard;
    }
}
