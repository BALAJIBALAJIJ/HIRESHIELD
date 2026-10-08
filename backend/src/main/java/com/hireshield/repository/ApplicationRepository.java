package com.hireshield.repository;

import com.hireshield.model.Application;
import com.hireshield.model.enums.ApplicationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByJobId(String jobId);
    List<Application> findByApplicantUserId(String applicantUserId);
    List<Application> findByJobIdAndStatus(String jobId, ApplicationStatus status);
    List<Application> findByOrganizationId(String organizationId);
    Optional<Application> findByJobIdAndApplicantUserId(String jobId, String applicantUserId);
    boolean existsByJobIdAndApplicantUserId(String jobId, String applicantUserId);
    long countByJobId(String jobId);
    long countByJobIdAndStatus(String jobId, ApplicationStatus status);
    long countByOrganizationId(String organizationId);
    long countByOrganizationIdAndStatus(String organizationId, ApplicationStatus status);
    long countByApplicantUserId(String applicantUserId);
    long countByApplicantUserIdAndStatus(String applicantUserId, ApplicationStatus status);
}
