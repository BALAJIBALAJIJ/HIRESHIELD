package com.hireshield.repository;

import com.hireshield.model.Organization;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OrganizationRepository extends MongoRepository<Organization, String> {
    Optional<Organization> findByCreatedByUserId(String userId);
}
