package com.hireshield.repository;

import com.hireshield.model.HiringTeamProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface HiringTeamProfileRepository extends MongoRepository<HiringTeamProfile, String> {
    Optional<HiringTeamProfile> findByUserId(String userId);
}
