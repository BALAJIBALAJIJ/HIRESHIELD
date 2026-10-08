package com.hireshield.repository;

import com.hireshield.model.ScreeningAnswer;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ScreeningAnswerRepository extends MongoRepository<ScreeningAnswer, String> {
    List<ScreeningAnswer> findByApplicationId(String applicationId);
    List<ScreeningAnswer> findByApplicationIdAndJobId(String applicationId, String jobId);
}
