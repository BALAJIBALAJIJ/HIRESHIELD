package com.hireshield.service;

import com.hireshield.dto.JobRequest;
import com.hireshield.model.Job;
import com.hireshield.model.ScreeningQuestion;
import com.hireshield.model.User;
import com.hireshield.repository.JobRepository;
import com.hireshield.repository.ScreeningQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final ScreeningQuestionRepository screeningQuestionRepository;

    public JobService(JobRepository jobRepository, ScreeningQuestionRepository screeningQuestionRepository) {
        this.jobRepository = jobRepository;
        this.screeningQuestionRepository = screeningQuestionRepository;
    }

    public Job createJob(JobRequest request, User currentUser) {
        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .requiredSkills(request.getRequiredSkills() != null ? request.getRequiredSkills() : new ArrayList<>())
                .requiredExperience(request.getRequiredExperience())
                .requiredQualification(request.getRequiredQualification())
                .location(request.getLocation())
                .workMode(request.getWorkMode())
                .salary(request.getSalary())
                .employmentType(request.getEmploymentType())
                .numberOfOpenings(request.getNumberOfOpenings())
                .applicationDeadline(request.getApplicationDeadline())
                .screeningCriteria(request.getScreeningCriteria() != null ? request.getScreeningCriteria() : new ArrayList<>())
                .organizationId(currentUser.getOrganizationId())
                .publishedByUserId(currentUser.getId())
                .active(true)
                .published(true)
                .build();

        job = jobRepository.save(job);

        // Create screening questions
        if (request.getScreeningQuestions() != null && !request.getScreeningQuestions().isEmpty()) {
            List<String> questionIds = new ArrayList<>();
            for (int i = 0; i < request.getScreeningQuestions().size(); i++) {
                ScreeningQuestion question = ScreeningQuestion.builder()
                        .jobId(job.getId())
                        .question(request.getScreeningQuestions().get(i))
                        .orderIndex(i)
                        .required(true)
                        .build();
                question = screeningQuestionRepository.save(question);
                questionIds.add(question.getId());
            }
            job.setScreeningQuestionIds(questionIds);
            job = jobRepository.save(job);
        }

        return job;
    }

    public List<Job> getJobsByOrganization(String organizationId) {
        return jobRepository.findByOrganizationId(organizationId);
    }

    public List<Job> getActiveJobsByOrganization(String organizationId) {
        return jobRepository.findByOrganizationIdAndActiveTrue(organizationId);
    }

    public List<Job> getMarketplaceJobs() {
        return jobRepository.findByPublishedTrueAndActiveTrue();
    }

    public Job getJobById(String jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    public Job updateJob(String jobId, JobRequest request, User currentUser) {
        Job job = getJobById(jobId);
        if (!job.getOrganizationId().equals(currentUser.getOrganizationId())) {
            throw new RuntimeException("Unauthorized to update this job");
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setRequiredExperience(request.getRequiredExperience());
        job.setRequiredQualification(request.getRequiredQualification());
        job.setLocation(request.getLocation());
        job.setWorkMode(request.getWorkMode());
        job.setSalary(request.getSalary());
        job.setEmploymentType(request.getEmploymentType());
        job.setNumberOfOpenings(request.getNumberOfOpenings());
        job.setApplicationDeadline(request.getApplicationDeadline());
        if (request.getScreeningCriteria() != null) {
            job.setScreeningCriteria(request.getScreeningCriteria());
        }

        return jobRepository.save(job);
    }

    public void deleteJob(String jobId, User currentUser) {
        Job job = getJobById(jobId);
        if (!job.getOrganizationId().equals(currentUser.getOrganizationId())) {
            throw new RuntimeException("Unauthorized to delete this job");
        }
        job.setActive(false);
        jobRepository.save(job);
    }

    public List<ScreeningQuestion> getScreeningQuestions(String jobId) {
        return screeningQuestionRepository.findByJobIdOrderByOrderIndexAsc(jobId);
    }

    public ScreeningQuestion addScreeningQuestion(String jobId, ScreeningQuestion request, User currentUser) {
        Job job = getJobById(jobId);
        if (!job.getOrganizationId().equals(currentUser.getOrganizationId())) {
            throw new RuntimeException("Unauthorized to add questions to this job");
        }
        if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
            throw new RuntimeException("Question text is required");
        }

        // Determine next order index
        List<ScreeningQuestion> existing = screeningQuestionRepository.findByJobIdOrderByOrderIndexAsc(jobId);
        int nextIndex = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getOrderIndex() + 1;

        ScreeningQuestion question = ScreeningQuestion.builder()
                .jobId(jobId)
                .question(request.getQuestion().trim())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .orderIndex(nextIndex)
                .required(request.isRequired())
                .build();

        question = screeningQuestionRepository.save(question);

        // Update job's screening question IDs
        List<String> questionIds = job.getScreeningQuestionIds();
        if (questionIds == null) {
            questionIds = new ArrayList<>();
        }
        questionIds.add(question.getId());
        job.setScreeningQuestionIds(questionIds);
        jobRepository.save(job);

        return question;
    }

    public void incrementApplicationCount(String jobId) {
        Job job = getJobById(jobId);
        job.setTotalApplications(job.getTotalApplications() + 1);
        jobRepository.save(job);
    }

    public void updateJobStats(String jobId, String field, int delta) {
        Job job = getJobById(jobId);
        switch (field) {
            case "eligible" -> job.setEligibleApplications(job.getEligibleApplications() + delta);
            case "rejected" -> job.setRejectedApplications(job.getRejectedApplications() + delta);
            case "shortlisted" -> job.setShortlistedApplications(job.getShortlistedApplications() + delta);
        }
        jobRepository.save(job);
    }
}
