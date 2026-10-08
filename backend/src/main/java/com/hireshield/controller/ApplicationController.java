package com.hireshield.controller;

import com.hireshield.dto.ApiResponse;
import com.hireshield.model.*;
import com.hireshield.service.ApplicationService;
import com.hireshield.service.AuthService;
import com.hireshield.service.CloudinaryService;
import com.hireshield.service.ScreeningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final AuthService authService;
    private final CloudinaryService cloudinaryService;
    private final ScreeningService screeningService;

    public ApplicationController(ApplicationService applicationService,
                                  AuthService authService,
                                  CloudinaryService cloudinaryService,
                                  ScreeningService screeningService) {
        this.applicationService = applicationService;
        this.authService = authService;
        this.cloudinaryService = cloudinaryService;
        this.screeningService = screeningService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> applyForJob(
            @RequestParam("jobId") String jobId,
            @RequestParam(value = "resume", required = false) MultipartFile resume,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = authService.getCurrentUser(userDetails.getUsername());

            String resumeUrl = null, resumeFileName = null, resumePublicId = null;
            if (resume != null && !resume.isEmpty()) {
                Map<String, String> uploadResult = cloudinaryService.uploadResume(resume);
                resumeUrl = uploadResult.get("url");
                resumePublicId = uploadResult.get("public_id");
                resumeFileName = resume.getOriginalFilename();
            }

            Application application = applicationService.applyForJob(
                    jobId, user.getId(), resumeUrl, resumeFileName, resumePublicId);
            return ResponseEntity.ok(ApiResponse.success("Application submitted successfully", application));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my-applications")
    public ResponseEntity<ApiResponse> getMyApplications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        List<Application> applications = applicationService.getApplicationsByApplicant(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Applications retrieved", applications));
    }

    @GetMapping("/{applicationId}")
    public ResponseEntity<ApiResponse> getApplication(@PathVariable String applicationId,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Application application = applicationService.getApplicationById(applicationId);

        // Authorization check
        if (!application.getApplicantUserId().equals(user.getId())
                && !application.getOrganizationId().equals(user.getOrganizationId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized access"));
        }

        return ResponseEntity.ok(ApiResponse.success("Application retrieved", application));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse> getApplicationsByJob(@PathVariable String jobId,
                                                             @RequestParam(required = false) String status) {
        List<Application> applications;
        if (status != null && !status.isEmpty()) {
            applications = applicationService.getApplicationsByJobAndStatus(jobId, status);
        } else {
            applications = applicationService.getApplicationsByJob(jobId);
        }
        return ResponseEntity.ok(ApiResponse.success("Applications retrieved", applications));
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<ApiResponse> updateStatus(@PathVariable String applicationId,
                                                     @RequestBody Map<String, String> body,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String status = body.get("status");
        String reason = body.get("reason");
        Application updated = applicationService.updateApplicationStatus(
                applicationId, status, reason, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Status updated", updated));
    }

    @PostMapping("/{applicationId}/notes")
    public ResponseEntity<ApiResponse> addNote(@PathVariable String applicationId,
                                                @RequestBody Map<String, String> body,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Application updated = applicationService.addInternalNote(
                applicationId, body.get("note"), user.getId(), user.getFullName());
        return ResponseEntity.ok(ApiResponse.success("Note added", updated));
    }

    @PostMapping("/{applicationId}/screening-answers")
    public ResponseEntity<ApiResponse> submitAnswers(@PathVariable String applicationId,
                                                      @RequestBody Map<String, Object> body,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        @SuppressWarnings("unchecked")
        List<Map<String, String>> answers = (List<Map<String, String>>) body.get("answers");
        applicationService.submitScreeningAnswers(applicationId, answers, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Screening answers submitted"));
    }

    @GetMapping("/{applicationId}/screening-answers")
    public ResponseEntity<ApiResponse> getScreeningAnswers(@PathVariable String applicationId) {
        List<ScreeningAnswer> answers = applicationService.getScreeningAnswers(applicationId);
        return ResponseEntity.ok(ApiResponse.success("Screening answers retrieved", answers));
    }

    @GetMapping("/{applicationId}/screening-result")
    public ResponseEntity<ApiResponse> getScreeningResult(@PathVariable String applicationId) {
        ScreeningResult result = screeningService.getResultByApplicationId(applicationId);
        return ResponseEntity.ok(ApiResponse.success("Screening result retrieved", result));
    }
}
