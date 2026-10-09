package com.hireshield.service;

import com.hireshield.model.*;
import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import com.hireshield.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final ApplicantProfileRepository applicantProfileRepository;
    private final ScreeningQuestionRepository screeningQuestionRepository;
    private final ScreeningAnswerRepository screeningAnswerRepository;
    private final NotificationRepository notificationRepository;
    private final JobService jobService;
    private final ScreeningService screeningService;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ApplicantProfileRepository applicantProfileRepository,
                              ScreeningQuestionRepository screeningQuestionRepository,
                              ScreeningAnswerRepository screeningAnswerRepository,
                              NotificationRepository notificationRepository,
                              JobService jobService,
                              ScreeningService screeningService) {
        this.applicationRepository = applicationRepository;
        this.applicantProfileRepository = applicantProfileRepository;
        this.screeningQuestionRepository = screeningQuestionRepository;
        this.screeningAnswerRepository = screeningAnswerRepository;
        this.notificationRepository = notificationRepository;
        this.jobService = jobService;
        this.screeningService = screeningService;
    }

    public Application applyForJob(String jobId, String applicantUserId, String resumeUrl,
                                    String resumeFileName, String resumePublicId) {
        if (applicationRepository.existsByJobIdAndApplicantUserId(jobId, applicantUserId)) {
            throw new RuntimeException("You have already applied for this job");
        }

        Job job = jobService.getJobById(jobId);
        if (!job.isActive() || !job.isPublished()) {
            throw new RuntimeException("This job is no longer accepting applications");
        }

        ApplicantProfile profile = applicantProfileRepository.findByUserId(applicantUserId)
                .orElseThrow(() -> new RuntimeException("Applicant profile not found"));

        String finalResumeUrl = resumeUrl != null ? resumeUrl : profile.getResumeUrl();
        String finalResumeFileName = resumeFileName != null ? resumeFileName : profile.getResumeFileName();
        String finalResumePublicId = resumePublicId != null ? resumePublicId : profile.getResumePublicId();

        Application application = Application.builder()
                .jobId(jobId)
                .applicantUserId(applicantUserId)
                .applicantProfileId(profile.getId())
                .organizationId(job.getOrganizationId())
                .resumeUrl(finalResumeUrl)
                .resumeFileName(finalResumeFileName)
                .resumePublicId(finalResumePublicId)
                .status(ApplicationStatus.APPLIED)
                .statusHistory(new ArrayList<>(List.of(
                        Application.StatusChange.builder()
                                .toStatus(ApplicationStatus.APPLIED)
                                .reason("Application submitted")
                                .changedAt(LocalDateTime.now())
                                .build()
                )))
                .build();

        application = applicationRepository.save(application);

        jobService.incrementApplicationCount(jobId);

        // Run AI screening pipeline
        performScreening(application, job, profile);

        return applicationRepository.findById(application.getId()).orElse(application);
    }

    private void performScreening(Application application, Job job, ApplicantProfile profile) {
        updateStatus(application, ApplicationStatus.SCREENING, null, "AI screening pipeline in progress");

        try {
            ScreeningResult result = screeningService.screenApplication(application, job, profile);
            applyScreeningResult(application, result, job);
        } catch (Exception e) {
            log.error("Screening failed for application {}: {}", application.getId(), e.getMessage());
            updateStatus(application, ApplicationStatus.NEEDS_REVIEW, null,
                    "Automated screening encountered an error. Manual review required.");
        }
    }

    private void applyScreeningResult(Application application, ScreeningResult result, Job job) {
        application.setScreeningResultId(result.getId());
        application.setMatchScore(Application.MatchScore.builder()
                .overall(result.getOverallScore())
                .skillsMatch(result.getSkillsMatchScore())
                .experienceMatch(result.getExperienceMatchScore())
                .qualificationMatch(result.getQualificationMatchScore())
                .mandatoryCriteriaMatch(result.getMandatoryScore())
                .jobRelevance(result.getOverallScore())
                .explanation(result.getOverallExplanation())
                .build());

        // Set all score breakdowns on the application
        application.setSkillsMatchScore(result.getSkillsMatchScore());
        application.setExperienceMatchScore(result.getExperienceMatchScore());
        application.setQualificationMatchScore(result.getQualificationMatchScore());
        application.setMandatoryScore(result.getMandatoryScore());
        application.setPreferredScore(result.getPreferredScore());
        application.setAnswerRelevanceScore(result.getAnswerRelevanceScore());
        application.setProfileResumeConsistencyScore(result.getProfileResumeConsistencyScore());
        application.setCrossValidationScore(result.getCrossValidationScore());

        // Set risk levels
        application.setResumeContentRisk(result.getResumeContentRisk());
        application.setResumeAiConfidence(result.getResumeAiConfidence());
        application.setAiContentRisk(result.getAiContentRisk());
        application.setResumeAuthenticityRisk(result.getResumeAuthenticityRisk());
        application.setNeedsHumanReview(result.isNeedsHumanReview());

        // Set final status
        ApplicationStatus finalStatus = result.getRecommendedStatus();
        if (finalStatus == ApplicationStatus.REJECTED) {
            application.setRejectionReason(result.getOverallExplanation());
            jobService.updateJobStats(job.getId(), "rejected", 1);
        } else if (finalStatus == ApplicationStatus.ELIGIBLE) {
            application.setEligibilityExplanation(result.getOverallExplanation());
            jobService.updateJobStats(job.getId(), "eligible", 1);
        }

        updateStatus(application, finalStatus, null, result.getOverallExplanation());

        createNotification(application.getApplicantUserId(),
                "Application Update",
                "Your application for " + job.getTitle() + " has been reviewed. Status: " + finalStatus.name(),
                "APPLICATION_STATUS",
                application.getId());
    }

    public Application updateApplicationStatus(String applicationId, String newStatus,
                                                 String reason, String changedByUserId) {
        Application application = getApplicationById(applicationId);
        ApplicationStatus status = ApplicationStatus.valueOf(newStatus.toUpperCase());

        if (status == ApplicationStatus.SHORTLISTED) {
            jobService.updateJobStats(application.getJobId(), "shortlisted", 1);
        }

        updateStatus(application, status, changedByUserId, reason);

        Job job = jobService.getJobById(application.getJobId());
        createNotification(application.getApplicantUserId(),
                "Application Status Update",
                "Your application for " + job.getTitle() + " status changed to: " + status.name()
                        + (reason != null ? ". Reason: " + reason : ""),
                "APPLICATION_STATUS",
                applicationId);

        return applicationRepository.findById(applicationId).orElse(application);
    }

    private void updateStatus(Application application, ApplicationStatus newStatus,
                               String changedByUserId, String reason) {
        Application.StatusChange change = Application.StatusChange.builder()
                .fromStatus(application.getStatus())
                .toStatus(newStatus)
                .changedByUserId(changedByUserId)
                .reason(reason)
                .changedAt(LocalDateTime.now())
                .build();

        application.getStatusHistory().add(change);
        application.setStatus(newStatus);

        if (newStatus == ApplicationStatus.REJECTED && reason != null) {
            application.setRejectionReason(reason);
        }
        if (newStatus == ApplicationStatus.ELIGIBLE && reason != null) {
            application.setEligibilityExplanation(reason);
        }

        applicationRepository.save(application);
    }

    public Application addInternalNote(String applicationId, String note,
                                        String userId, String userName) {
        Application application = getApplicationById(applicationId);
        application.getInternalNotes().add(Application.InternalNote.builder()
                .note(note)
                .addedByUserId(userId)
                .addedByName(userName)
                .addedAt(LocalDateTime.now())
                .build());
        return applicationRepository.save(application);
    }

    public void submitScreeningAnswers(String applicationId, List<Map<String, String>> answers,
                                        String applicantUserId) {
        Application application = getApplicationById(applicationId);
        if (!application.getApplicantUserId().equals(applicantUserId)) {
            throw new RuntimeException("Unauthorized access");
        }

        Job job = jobService.getJobById(application.getJobId());
        ApplicantProfile profile = applicantProfileRepository.findByUserId(applicantUserId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        // Build Q&A list for AI
        List<Map<String, String>> questionsAndAnswers = new ArrayList<>();

        for (Map<String, String> answerData : answers) {
            String questionId = answerData.get("questionId");
            String answerText = answerData.get("answer");

            ScreeningQuestion question = screeningQuestionRepository.findById(questionId)
                    .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

            // Analyze the answer
            Map<String, Object> analysis = screeningService.analyzeScreeningAnswer(
                    question.getQuestion(), answerText);

            ScreeningAnswer screeningAnswer = ScreeningAnswer.builder()
                    .applicationId(applicationId)
                    .questionId(questionId)
                    .jobId(application.getJobId())
                    .applicantUserId(applicantUserId)
                    .question(question.getQuestion())
                    .answer(answerText)
                    .relevanceScore((double) analysis.get("relevanceScore"))
                    .aiContentRisk((ContentRiskLevel) analysis.get("aiContentRisk"))
                    .aiConfidence((double) analysis.get("aiConfidence"))
                    .evaluationStatus((String) analysis.get("evaluationStatus"))
                    .evaluationExplanation((String) analysis.get("evaluationExplanation"))
                    .build();

            screeningAnswerRepository.save(screeningAnswer);

            questionsAndAnswers.add(Map.of(
                    "question", question.getQuestion(),
                    "answer", answerText
            ));
        }

        // Run full AI screening with answers
        try {
            ScreeningResult result = screeningService.screenWithAnswers(application, job, profile, questionsAndAnswers);
            applyScreeningResult(application, result, job);
        } catch (Exception e) {
            log.error("Full screening with answers failed: {}", e.getMessage());
        }
    }

    public Application getApplicationById(String applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public List<Application> getApplicationsByJob(String jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    public List<Application> getApplicationsByApplicant(String applicantUserId) {
        return applicationRepository.findByApplicantUserId(applicantUserId);
    }

    public List<Application> getApplicationsByJobAndStatus(String jobId, String status) {
        return applicationRepository.findByJobIdAndStatus(jobId, ApplicationStatus.valueOf(status.toUpperCase()));
    }

    public List<Application> getApplicationsByOrganization(String organizationId) {
        return applicationRepository.findByOrganizationId(organizationId);
    }

    public List<ScreeningAnswer> getScreeningAnswers(String applicationId) {
        return screeningAnswerRepository.findByApplicationId(applicationId);
    }

    private void createNotification(String userId, String title, String message,
                                     String type, String referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}
