package com.hireshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SubmitAnswersRequest {
    @NotBlank private String applicationId;
    private List<ScreeningAnswerRequest> answers;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ScreeningAnswerRequest {
        @NotBlank private String questionId;
        @NotBlank private String answer;
    }
}

