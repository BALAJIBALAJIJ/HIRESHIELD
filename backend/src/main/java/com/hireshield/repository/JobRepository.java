package com.hireshield.repository;

import com.hireshield.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByOrganizationIdAndActiveTrue(String organizationId);
    List<Job> findByPublishedTrueAndActiveTrue();
    List<Job> findByPublishedByUserId(String userId);
    List<Job> findByOrganizationId(String organizationId);
    long countByOrganizationIdAndActiveTrue(String organizationId);
}
