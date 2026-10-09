package com.hireshield.service;

import com.hireshield.model.*;
import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import com.hireshield.model.enums.RequirementType;
import com.hireshield.repository.ScreeningResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Screening service that orchestrates the full AI screening pipeline.
 * Uses Gemini for deep analysis with heuristic fallback.
 */
@Service
public class ScreeningService {

    private static final Logger log = LoggerFactory.getLogger(ScreeningService.class);

    private final ScreeningResultRepository screeningResultRepository;
    private final AIScreeningPipeline aiPipeline;
    private final GeminiService geminiService;

    public ScreeningService(ScreeningResultRepository screeningResultRepository,
                            AIScreeningPipeline aiPipeline,
                            GeminiService geminiService) {
        this.screeningResultRepository = screeningResultRepository;
        this.aiPipeline = aiPipeline;
        this.geminiService = geminiService;
    }

    /**
     * Full screening pipeline with Gemini AI.
     */
    @SuppressWarnings("unchecked")
    public ScreeningResult screenApplication(Application application, Job job, ApplicantProfile profile) {
        log.info("Starting AI screening pipeline for application: {}", application.getId());

        // Step 1: Resume Analysis (if resume available)
        Map<String, Object> resumeData = null;
        // For now, we use profile data as resume proxy. When base64 resume is available, use aiPipeline.analyzeResume()
        resumeData = createResumeDataFromProfile(profile);

        // Step 2: Profile-Resume Consistency
        Map<String, Object> consistencyResult = aiPipeline.checkProfileResumeConsistency(profile, resumeData);
        log.info("Profile-Resume consistency score: {}", consistencyResult.get("consistencyScore"));

        // Step 3: Job Matching
        Map<String, Object> jobMatch = aiPipeline.matchResumeToJob(resumeData, profile, job);
        log.info("Job match score: {}", jobMatch.get("jobMatchScore"));

        // Step 4: Generate Final Decision
        Map<String, Object> finalDecision = aiPipeline.generateFinalDecision(
                jobMatch, consistencyResult, Map.of("crossValidationScore", 80, "isConsistent", true),
                resumeData, List.of());

        // Build ScreeningResult from AI response
        ScreeningResult result = buildScreeningResult(application, job, finalDecision, jobMatch, consistencyResult, resumeData);

        return screeningResultRepository.save(result);
    }

    /**
     * Screen application WITH screening answers (called after answers are submitted).
     */
    @SuppressWarnings("unchecked")
    public ScreeningResult screenWithAnswers(Application application, Job job, ApplicantProfile profile,
                                              List<Map<String, String>> questionsAndAnswers) {
        log.info("Starting full AI screening with answers for application: {}", application.getId());

        Map<String, Object> resumeData = createResumeDataFromProfile(profile);

        // Step 1: Profile-Resume Consistency
        Map<String, Object> consistencyResult = aiPipeline.checkProfileResumeConsistency(profile, resumeData);

        // Step 2: Job Matching
        Map<String, Object> jobMatch = aiPipeline.matchResumeToJob(resumeData, profile, job);

        // Step 3: Analyze each answer
        List<Map<String, Object>> answerAnalyses = new ArrayList<>();
        if (questionsAndAnswers != null) {
            for (Map<String, String> qa : questionsAndAnswers) {
                Map<String, Object> answerResult = aiPipeline.analyzeAnswer(
                        qa.get("question"), qa.get("answer"), job, profile, resumeData);
                answerResult.put("question", qa.get("question"));
                answerResult.put("answer", qa.get("answer"));
                answerAnalyses.add(answerResult);
            }
        }

        // Step 4: Cross-Validation
        Map<String, Object> crossValidation = aiPipeline.crossValidate(profile, resumeData, questionsAndAnswers, job);

        // Step 5: Final Decision
        Map<String, Object> finalDecision = aiPipeline.generateFinalDecision(
                jobMatch, consistencyResult, crossValidation, resumeData, answerAnalyses);

        // Build comprehensive result
        ScreeningResult result = buildScreeningResult(application, job, finalDecision, jobMatch, consistencyResult, resumeData);
        result.setAnswerAnalyses(answerAnalyses);
        result.setCrossValidationScore(getDouble(crossValidation, "crossValidationScore", 80));
        result.setCrossValidationAssessment(getString(crossValidation, "overallAssessment", "CONSISTENT"));
        result.setContradictions((List<Map<String, Object>>) crossValidation.getOrDefault("contradictions", List.of()));

        // Calculate answer relevance average
        if (!answerAnalyses.isEmpty()) {
            double avgRelevance = answerAnalyses.stream()
                    .mapToDouble(a -> getDouble(a, "relevanceScore", 60))
                    .average().orElse(60);
            result.setAnswerRelevanceScore(avgRelevance);
        }

        return screeningResultRepository.save(result);
    }

    @SuppressWarnings("unchecked")
    private ScreeningResult buildScreeningResult(Application application, Job job,
                                                  Map<String, Object> finalDecision,
                                                  Map<String, Object> jobMatch,
                                                  Map<String, Object> consistency,
                                                  Map<String, Object> resumeData) {
        String decision = getString(finalDecision, "decision", "NEEDS_REVIEW");
        ApplicationStatus status;
        switch (decision) {
            case "ELIGIBLE": status = ApplicationStatus.ELIGIBLE; break;
            case "REJECTED": status = ApplicationStatus.REJECTED; break;
            default: status = ApplicationStatus.NEEDS_REVIEW;
        }

        String resumeRiskStr = getString(finalDecision, "resumeAuthenticityRisk", "LOW");
        ContentRiskLevel resumeRisk;
        try { resumeRisk = ContentRiskLevel.valueOf(resumeRiskStr); } catch (Exception e) { resumeRisk = ContentRiskLevel.LOW; }

        String aiRiskStr = getString(finalDecision, "aiContentRisk", "LOW");
        ContentRiskLevel aiRisk;
        try { aiRisk = ContentRiskLevel.valueOf(aiRiskStr); } catch (Exception e) { aiRisk = ContentRiskLevel.LOW; }

        // Build criteria results from jobMatch
        List<ScreeningResult.CriterionResult> criteriaResults = new ArrayList<>();
        Object criteriaObj = jobMatch.get("criteriaResults");
        if (criteriaObj instanceof List) {
            for (Object item : (List<?>) criteriaObj) {
                if (item instanceof Map) {
                    Map<String, Object> cr = (Map<String, Object>) item;
                    criteriaResults.add(ScreeningResult.CriterionResult.builder()
                            .category(getString(cr, "category", ""))
                            .requirement(getString(cr, "requirement", ""))
                            .type(getString(cr, "type", "PREFERRED"))
                            .satisfied(getBool(cr, "satisfied", true))
                            .explanation(getString(cr, "explanation", ""))
                            .confidence(getDouble(cr, "confidence", 0.7))
                            .build());
                }
            }
        }

        // Build explanation
        List<String> reasons = new ArrayList<>();
        Object reasonsObj = finalDecision.get("reasons");
        if (reasonsObj instanceof List) {
            for (Object r : (List<?>) reasonsObj) reasons.add(r.toString());
        }

        List<String> warnings = new ArrayList<>();
        Object warningsObj = finalDecision.get("warnings");
        if (warningsObj instanceof List) {
            for (Object w : (List<?>) warningsObj) warnings.add(w.toString());
        }

        List<String> failedReqs = new ArrayList<>();
        Object failedObj = finalDecision.get("failedRequirements");
        if (failedObj instanceof List) {
            for (Object f : (List<?>) failedObj) failedReqs.add(f.toString());
        }

        String explanation = reasons.isEmpty()
                ? "Screening completed. Decision: " + decision
                : String.join(" ", reasons);

        return ScreeningResult.builder()
                .applicationId(application.getId())
                .jobId(job.getId())
                .applicantUserId(application.getApplicantUserId())
                .recommendedStatus(status)
                .overallScore(getDouble(finalDecision, "jobMatchScore", 70))
                .overallExplanation(explanation)
                .skillsMatchScore(getDouble(finalDecision, "skillsMatchScore", 70))
                .experienceMatchScore(getDouble(finalDecision, "experienceMatchScore", 70))
                .qualificationMatchScore(getDouble(finalDecision, "qualificationMatchScore", 70))
                .mandatoryScore(getDouble(finalDecision, "mandatoryScore", 100))
                .preferredScore(getDouble(finalDecision, "preferredScore", 70))
                .answerRelevanceScore(getDouble(finalDecision, "answerRelevanceScore", 70))
                .profileResumeConsistencyScore(getDouble(consistency, "consistencyScore", 85))
                .crossValidationScore(getDouble(finalDecision, "crossValidationScore", 80))
                .criteriaResults(criteriaResults)
                .matchedSkills((List<String>) jobMatch.getOrDefault("matchedSkills", List.of()))
                .missingSkills((List<String>) jobMatch.getOrDefault("missingSkills", List.of()))
                .resumeContentRisk(resumeRisk)
                .resumeAiConfidence(getDouble(finalDecision, "aiGenerationRiskScore", 10) / 100.0)
                .resumeAnalysisDetails(getString(resumeData, "authenticityExplanation", ""))
                .aiContentRisk(aiRisk)
                .resumeAuthenticityRisk(resumeRiskStr)
                .parsedResumeData(resumeData)
                .needsHumanReview(getBool(finalDecision, "needsHumanReview", false))
                .failedRequirements(failedReqs)
                .warnings(warnings)
                .reasons(reasons)
                .build();
    }

    private Map<String, Object> createResumeDataFromProfile(ApplicantProfile profile) {
        Map<String, Object> data = new HashMap<>();
        data.put("fullName", profile.getFullName());
        data.put("professionalTitle", profile.getProfessionalTitle());
        data.put("education", profile.getEducation());
        data.put("allSkillsList", profile.getSkills() != null ? profile.getSkills() : List.of());
        data.put("totalYearsOfExperience", profile.getYearsOfExperience());
        data.put("location", profile.getLocation());
        data.put("professionalSummary", profile.getProfessionalSummary());
        data.put("certifications", profile.getCertifications() != null ? profile.getCertifications() : List.of());
        data.put("linkedinUrl", profile.getLinkedinUrl());
        data.put("githubUrl", profile.getGithubUrl());
        data.put("portfolioUrl", profile.getPortfolioUrl());
        data.put("authenticityRisk", "LOW");
        data.put("authenticityExplanation", "Using applicant profile data.");
        return data;
    }

    /**
     * Analyze a screening answer with AI.
     */
    public Map<String, Object> analyzeScreeningAnswer(String question, String answer) {
        // Simple heuristic fallback (always available)
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> aiAnalysis = analyzeContentAuthenticity(answer);
        result.put("aiContentRisk", aiAnalysis.get("riskLevel"));
        result.put("aiConfidence", aiAnalysis.get("confidence"));

        double relevance = analyzeAnswerRelevance(question, answer);
        result.put("relevanceScore", relevance);

        String evaluationStatus;
        if (relevance >= 60) evaluationStatus = "RELEVANT";
        else if (relevance >= 30) evaluationStatus = "NEEDS_REVIEW";
        else evaluationStatus = "IRRELEVANT";
        result.put("evaluationStatus", evaluationStatus);

        String explanation;
        if (evaluationStatus.equals("RELEVANT")) explanation = "Answer appears relevant and addresses the question.";
        else if (evaluationStatus.equals("NEEDS_REVIEW")) explanation = "Answer partially addresses the question. Manual review recommended.";
        else explanation = "Answer does not appear to address the question.";
        result.put("evaluationExplanation", explanation);

        return result;
    }

    public Map<String, Object> analyzeContentAuthenticity(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Map.of("riskLevel", ContentRiskLevel.LOW, "confidence", 0.1);
        }

        List<String> aiIndicators = List.of("leveraged", "spearheaded", "orchestrated", "synergized",
                "utilized cutting-edge", "passionate about", "results-driven professional", "proven track record",
                "detail-oriented", "self-motivated", "team player", "highly motivated");

        String textLower = text.toLowerCase();
        int count = 0;
        for (String ind : aiIndicators) { if (textLower.contains(ind)) count++; }

        String[] sentences = text.split("[.!?]+");
        if (sentences.length > 3) {
            double mean = Arrays.stream(sentences).mapToInt(s -> s.trim().split("\\s+").length).average().orElse(0);
            double variance = Arrays.stream(sentences).mapToDouble(s -> Math.pow(s.trim().split("\\s+").length - mean, 2)).average().orElse(0);
            if (variance < 5) count++;
        }

        ContentRiskLevel risk;
        double confidence;
        if (count >= 5) { risk = ContentRiskLevel.HIGH; confidence = Math.min(0.75, 0.5 + count * 0.05); }
        else if (count >= 2) { risk = ContentRiskLevel.MEDIUM; confidence = 0.3 + count * 0.08; }
        else { risk = ContentRiskLevel.LOW; confidence = 0.1 + count * 0.05; }

        return Map.of("riskLevel", risk, "confidence", confidence);
    }

    private double analyzeAnswerRelevance(String question, String answer) {
        if (answer == null || answer.trim().length() < 10) return 10.0;
        if (question == null || question.trim().isEmpty()) return 70.0;

        Set<String> stopWords = Set.of("the", "a", "an", "and", "or", "is", "in", "at", "to", "for",
                "of", "with", "on", "by", "your", "you", "what", "how", "why", "explain",
                "describe", "tell", "us", "about", "do", "have", "has", "are", "can", "would");

        Set<String> qWords = new HashSet<>(Arrays.asList(question.toLowerCase().split("\\s+")));
        qWords.removeAll(stopWords);
        qWords.removeIf(w -> w.length() < 3);

        if (qWords.isEmpty()) return 60.0;
        String aLower = answer.toLowerCase();
        long matchCount = qWords.stream().filter(aLower::contains).count();
        double base = (matchCount * 100.0 / qWords.size());

        int wordCount = answer.trim().split("\\s+").length;
        if (wordCount >= 20) base += 10;
        if (wordCount >= 50) base += 10;

        return Math.min(100.0, base);
    }

    public ScreeningResult getResultByApplicationId(String applicationId) {
        return screeningResultRepository.findByApplicationId(applicationId).orElse(null);
    }

    // Helper methods
    private String getString(Map<String, Object> map, String key, String fallback) {
        Object val = map.get(key);
        return val != null ? val.toString() : fallback;
    }
    private double getDouble(Map<String, Object> map, String key, double fallback) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).doubleValue();
        return fallback;
    }
    private boolean getBool(Map<String, Object> map, String key, boolean fallback) {
        Object val = map.get(key);
        if (val instanceof Boolean) return (Boolean) val;
        return fallback;
    }
}
