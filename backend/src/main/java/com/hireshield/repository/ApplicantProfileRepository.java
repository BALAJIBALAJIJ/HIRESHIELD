package com.hireshield.repository;

import com.hireshield.model.ApplicantProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ApplicantProfileRepository extends MongoRepository<ApplicantProfile, String> {
    Optional<ApplicantProfile> findByUserId(String userId);
}
