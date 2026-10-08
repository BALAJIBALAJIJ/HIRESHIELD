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
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId;
    private String title;
    private String message;
    private String type;          // APPLICATION_STATUS, JOB_UPDATE, SCREENING_COMPLETE, etc.
    private String referenceId;   // ID of related entity (applicationId, jobId, etc.)
    private boolean read;

    @CreatedDate
    private LocalDateTime createdAt;
}
