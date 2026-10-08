package com.hireshield.dto;

import com.hireshield.model.Job.ScreeningCriterion;
import com.hireshield.model.enums.EmploymentType;
import com.hireshield.model.enums.WorkMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    private List<String> requiredSkills;
    private String requiredExperience;
    private String requiredQualification;
    private String location;
    private WorkMode workMode;
    private String salary;
    private EmploymentType employmentType;
    private int numberOfOpenings;
    private LocalDate applicationDeadline;
    private List<ScreeningCriterion> screeningCriteria;
    private List<String> screeningQuestions;
}
