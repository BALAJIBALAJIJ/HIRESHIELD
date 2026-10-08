package com.hireshield.repository;

import com.hireshield.model.ScreeningQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ScreeningQuestionRepository extends MongoRepository<ScreeningQuestion, String> {
    List<ScreeningQuestion> findByJobIdOrderByOrderIndexAsc(String jobId);
    void deleteByJobId(String jobId);
}
