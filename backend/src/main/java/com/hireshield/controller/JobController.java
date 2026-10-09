package com.hireshield.controller;

import com.hireshield.dto.ApiResponse;
import com.hireshield.dto.JobRequest;
import com.hireshield.model.Job;
import com.hireshield.model.ScreeningQuestion;
import com.hireshield.model.User;
import com.hireshield.service.AuthService;
import com.hireshield.service.JobService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final AuthService authService;

    public JobController(JobService jobService, AuthService authService) {
        this.jobService = jobService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createJob(@Valid @RequestBody JobRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Job job = jobService.createJob(request, user);
        return ResponseEntity.ok(ApiResponse.success("Job created and published successfully", job));
    }

    @GetMapping("/marketplace")
    public ResponseEntity<ApiResponse> getMarketplaceJobs() {
        List<Job> jobs = jobService.getMarketplaceJobs();
        return ResponseEntity.ok(ApiResponse.success("Jobs retrieved", jobs));
    }

    @GetMapping("/public/{jobId}")
    public ResponseEntity<ApiResponse> getJobPublic(@PathVariable String jobId) {
        Job job = jobService.getJobById(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job details retrieved", job));
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<ApiResponse> getMyJobs(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        List<Job> jobs = jobService.getJobsByOrganization(user.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success("Jobs retrieved", jobs));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse> getJob(@PathVariable String jobId) {
        Job job = jobService.getJobById(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job retrieved", job));
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse> updateJob(@PathVariable String jobId,
                                                  @Valid @RequestBody JobRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Job job = jobService.updateJob(jobId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Job updated", job));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<ApiResponse> deleteJob(@PathVariable String jobId,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        jobService.deleteJob(jobId, user);
        return ResponseEntity.ok(ApiResponse.success("Job deactivated"));
    }

    @GetMapping("/{jobId}/screening-questions")
    public ResponseEntity<ApiResponse> getScreeningQuestions(@PathVariable String jobId) {
        List<ScreeningQuestion> questions = jobService.getScreeningQuestions(jobId);
        return ResponseEntity.ok(ApiResponse.success("Screening questions retrieved", questions));
    }

    @PostMapping("/{jobId}/screening-questions")
    public ResponseEntity<ApiResponse> addScreeningQuestion(@PathVariable String jobId,
                                                              @RequestBody ScreeningQuestion request,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        ScreeningQuestion question = jobService.addScreeningQuestion(jobId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Screening question added", question));
    }
}
