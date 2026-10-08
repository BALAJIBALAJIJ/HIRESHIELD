package com.hireshield.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "screening_questions")
public class ScreeningQuestion {

    @Id
    private String id;

    private String jobId;
    private String question;
    private int orderIndex;
    private boolean required;

    @CreatedDate
    private LocalDateTime createdAt;
}
