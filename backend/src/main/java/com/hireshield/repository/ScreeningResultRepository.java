package com.hireshield.repository;

import com.hireshield.model.ScreeningResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ScreeningResultRepository extends MongoRepository<ScreeningResult, String> {
    Optional<ScreeningResult> findByApplicationId(String applicationId);
}
