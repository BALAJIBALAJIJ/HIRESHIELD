package com.hireshield.service;

import com.hireshield.model.*;
import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import com.hireshield.model.enums.RequirementType;
import com.hireshield.repository.ScreeningResultRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-assisted screening engine that analyzes resumes and answers against job requirements.
 * Uses rule-based analysis with NLP heuristics for explainable, transparent scoring.
 * Never claims 100% certainty — all AI detection uses confidence-based indicators.
 */
@Service
public class ScreeningService {

    private final ScreeningResultRepository screeningResultRepository;

    // Common AI-generated content indicators
    private static final List<String> AI_INDICATORS = List.of(
            "leveraged", "spearheaded", "orchestrated", "synergized", "facilitated",
            "utilized cutting-edge", "drove innovation", "passionate about",
            "results-driven professional", "proven track record",
            "detail-oriented", "self-motivated", "team player",
            "highly motivated", "dynamic professional"
    );

    private static final List<String> FABRICATION_INDICATORS = List.of(
            "lorem ipsum", "placeholder", "sample text", "test data",
            "john doe", "jane doe", "example.com", "xxx"
    );

    public ScreeningService(ScreeningResultRepository screeningResultRepository) {
        this.screeningResultRepository = screeningResultRepository;
    }

    /**
     * Perform comprehensive screening of an application against job requirements.
     */
    public ScreeningResult screenApplication(Application application, Job job, ApplicantProfile profile) {
        List<ScreeningResult.CriterionResult> criteriaResults = new ArrayList<>();
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        // 1. Skills matching
        double skillsScore = analyzeSkills(job.getRequiredSkills(), profile.getSkills(), matchedSkills, missingSkills);

        // 2. Experience matching
        double experienceScore = analyzeExperience(job.getRequiredExperience(), profile.getYearsOfExperience());

        // 3. Qualification matching
        double qualificationScore = analyzeQualification(job.getRequiredQualification(), profile.getEducation());

        // 4. Screening criteria evaluation
        double mandatoryScore = evaluateScreeningCriteria(job.getScreeningCriteria(), profile, criteriaResults);

        // 5. Job relevance based on profile summary and title
        double relevanceScore = analyzeJobRelevance(job, profile);

        // 6. AI content analysis of resume
        ContentRiskLevel resumeRisk = ContentRiskLevel.LOW;
        double aiConfidence = 0.1;
        if (profile.getProfessionalSummary() != null) {
            Map<String, Object> aiAnalysis = analyzeContentAuthenticity(profile.getProfessionalSummary());
            resumeRisk = (ContentRiskLevel) aiAnalysis.get("riskLevel");
            aiConfidence = (double) aiAnalysis.get("confidence");
        }

        // Calculate overall score
        double overallScore = calculateOverallScore(skillsScore, experienceScore, qualificationScore, mandatoryScore, relevanceScore);

        // Determine recommended status
        boolean mandatoryFailed = criteriaResults.stream()
                .anyMatch(cr -> cr.getType().equals("MANDATORY") && !cr.isSatisfied());

        ApplicationStatus recommendedStatus;
        String explanation;

        if (mandatoryFailed) {
            recommendedStatus = ApplicationStatus.REJECTED;
            String failedCriteria = criteriaResults.stream()
                    .filter(cr -> cr.getType().equals("MANDATORY") && !cr.isSatisfied())
                    .map(ScreeningResult.CriterionResult::getExplanation)
                    .collect(Collectors.joining("; "));
            explanation = "Application rejected: Mandatory requirements not satisfied. " + failedCriteria;
        } else if (resumeRisk == ContentRiskLevel.HIGH) {
            recommendedStatus = ApplicationStatus.NEEDS_REVIEW;
            explanation = "Candidate meets requirements but resume content shows high AI-generated likelihood (confidence: "
                    + String.format("%.0f%%", aiConfidence * 100) + "). Manual review recommended.";
        } else if (overallScore >= 70) {
            recommendedStatus = ApplicationStatus.ELIGIBLE;
            explanation = "Candidate matches the job requirements with a score of " + String.format("%.0f%%", overallScore)
                    + ". Skills, experience, and qualifications align well with the position.";
        } else if (overallScore >= 50) {
            recommendedStatus = ApplicationStatus.NEEDS_REVIEW;
            explanation = "Candidate partially matches requirements (score: " + String.format("%.0f%%", overallScore)
                    + "). Some criteria are met but manual review is recommended.";
        } else {
            recommendedStatus = ApplicationStatus.REJECTED;
            explanation = "Application does not meet minimum requirements. Match score: "
                    + String.format("%.0f%%", overallScore) + ". Key gaps: "
                    + (missingSkills.isEmpty() ? "general mismatch" : String.join(", ", missingSkills));
        }

        ScreeningResult result = ScreeningResult.builder()
                .applicationId(application.getId())
                .jobId(job.getId())
                .applicantUserId(application.getApplicantUserId())
                .recommendedStatus(recommendedStatus)
                .overallScore(overallScore)
                .overallExplanation(explanation)
                .criteriaResults(criteriaResults)
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .resumeContentRisk(resumeRisk)
                .resumeAiConfidence(aiConfidence)
                .resumeAnalysisDetails(resumeRisk == ContentRiskLevel.LOW
                        ? "Resume content appears authentic with low AI-generation indicators."
                        : "Resume content shows indicators consistent with AI-generated text. This is a likelihood assessment, not a definitive determination.")
                .build();

        return screeningResultRepository.save(result);
    }

    /**
     * Analyze skills match between required and candidate skills.
     */
    private double analyzeSkills(List<String> required, List<String> candidate,
                                  List<String> matched, List<String> missing) {
        if (required == null || required.isEmpty()) return 80.0;
        if (candidate == null || candidate.isEmpty()) {
            missing.addAll(required);
            return 0.0;
        }

        Set<String> candidateSkillsLower = candidate.stream()
                .map(String::toLowerCase)
                .map(String::trim)
                .collect(Collectors.toSet());

        for (String skill : required) {
            String skillLower = skill.toLowerCase().trim();
            boolean found = candidateSkillsLower.stream()
                    .anyMatch(cs -> cs.contains(skillLower) || skillLower.contains(cs));
            if (found) {
                matched.add(skill);
            } else {
                missing.add(skill);
            }
        }

        return required.isEmpty() ? 80.0 : (matched.size() * 100.0 / required.size());
    }

    /**
     * Analyze experience match.
     */
    private double analyzeExperience(String requiredExp, int candidateYears) {
        if (requiredExp == null || requiredExp.isEmpty()) return 80.0;

        try {
            // Try to extract a number from the required experience string
            String digits = requiredExp.replaceAll("[^0-9]", "");
            if (digits.isEmpty()) return 70.0;

            int requiredYears = Integer.parseInt(digits);
            if (candidateYears >= requiredYears) return 100.0;
            if (candidateYears >= requiredYears - 1) return 75.0;
            if (candidateYears > 0) return (candidateYears * 100.0 / requiredYears);
            return 20.0;
        } catch (NumberFormatException e) {
            return 70.0; // Can't parse, give moderate score
        }
    }

    /**
     * Analyze qualification match.
     */
    private double analyzeQualification(String required, String candidateEdu) {
        if (required == null || required.isEmpty()) return 80.0;
        if (candidateEdu == null || candidateEdu.isEmpty()) return 30.0;

        String reqLower = required.toLowerCase();
        String candLower = candidateEdu.toLowerCase();

        // Check for common degree patterns
        Map<String, List<String>> degreeAliases = Map.of(
                "b.e", List.of("be", "b.e", "bachelor of engineering", "btech", "b.tech"),
                "b.tech", List.of("btech", "b.tech", "bachelor of technology", "be", "b.e"),
                "m.tech", List.of("mtech", "m.tech", "master of technology", "me", "m.e"),
                "mba", List.of("mba", "master of business"),
                "mca", List.of("mca", "master of computer application"),
                "bca", List.of("bca", "bachelor of computer application"),
                "phd", List.of("phd", "ph.d", "doctorate", "doctor of philosophy"),
                "bsc", List.of("bsc", "b.sc", "bachelor of science"),
                "msc", List.of("msc", "m.sc", "master of science")
        );

        for (Map.Entry<String, List<String>> entry : degreeAliases.entrySet()) {
            boolean reqMatches = entry.getValue().stream().anyMatch(reqLower::contains);
            boolean candMatches = entry.getValue().stream().anyMatch(candLower::contains);
            if (reqMatches && candMatches) return 100.0;
        }

        if (candLower.contains(reqLower) || reqLower.contains(candLower)) return 90.0;
        return 40.0;
    }

    /**
     * Evaluate screening criteria (mandatory vs preferred).
     */
    private double evaluateScreeningCriteria(List<Job.ScreeningCriterion> criteria,
                                              ApplicantProfile profile,
                                              List<ScreeningResult.CriterionResult> results) {
        if (criteria == null || criteria.isEmpty()) return 100.0;

        int mandatoryTotal = 0, mandatoryMet = 0;
        int preferredTotal = 0, preferredMet = 0;

        String profileText = buildProfileText(profile);

        for (Job.ScreeningCriterion criterion : criteria) {
            boolean satisfied = checkCriterion(criterion, profile, profileText);
            String explanation = satisfied
                    ? "Candidate satisfies the " + criterion.getCategory() + " requirement: " + criterion.getRequirement()
                    : "Candidate does not satisfy the " + criterion.getCategory() + " requirement: " + criterion.getRequirement();

            results.add(ScreeningResult.CriterionResult.builder()
                    .category(criterion.getCategory())
                    .requirement(criterion.getRequirement())
                    .type(criterion.getType().name())
                    .satisfied(satisfied)
                    .explanation(explanation)
                    .confidence(satisfied ? 0.85 : 0.80)
                    .build());

            if (criterion.getType() == RequirementType.MANDATORY) {
                mandatoryTotal++;
                if (satisfied) mandatoryMet++;
            } else {
                preferredTotal++;
                if (satisfied) preferredMet++;
            }
        }

        if (mandatoryTotal > 0 && mandatoryMet < mandatoryTotal) return 0.0;

        double mandatoryScore = mandatoryTotal > 0 ? (mandatoryMet * 100.0 / mandatoryTotal) : 100.0;
        double preferredScore = preferredTotal > 0 ? (preferredMet * 100.0 / preferredTotal) : 100.0;

        return mandatoryScore * 0.7 + preferredScore * 0.3;
    }

    /**
     * Check if a criterion is satisfied by the candidate.
     */
    private boolean checkCriterion(Job.ScreeningCriterion criterion, ApplicantProfile profile, String profileText) {
        String req = criterion.getRequirement().toLowerCase().trim();
        String category = criterion.getCategory().toLowerCase();

        // Check skills
        if (category.contains("skill") || category.contains("programming") || category.contains("technology") || category.contains("technical")) {
            return profile.getSkills() != null && profile.getSkills().stream()
                    .anyMatch(s -> s.toLowerCase().contains(req) || req.contains(s.toLowerCase()));
        }

        // Check education/degree
        if (category.contains("degree") || category.contains("qualification") || category.contains("education")) {
            return profile.getEducation() != null && (
                    profile.getEducation().toLowerCase().contains(req) || req.contains(profile.getEducation().toLowerCase()));
        }

        // Check certification
        if (category.contains("certification") || category.contains("certificate")) {
            return profile.getCertifications() != null && profile.getCertifications().stream()
                    .anyMatch(c -> c.toLowerCase().contains(req) || req.contains(c.toLowerCase()));
        }

        // Check experience
        if (category.contains("experience") || category.contains("years")) {
            try {
                String digits = req.replaceAll("[^0-9]", "");
                if (!digits.isEmpty()) {
                    int requiredYears = Integer.parseInt(digits);
                    return profile.getYearsOfExperience() >= requiredYears;
                }
            } catch (NumberFormatException e) {
                // Fall through to text matching
            }
        }

        // Generic text-based matching
        return profileText.contains(req);
    }

    /**
     * Build a searchable text representation of the profile.
     */
    private String buildProfileText(ApplicantProfile profile) {
        StringBuilder sb = new StringBuilder();
        if (profile.getFullName() != null) sb.append(profile.getFullName()).append(" ");
        if (profile.getProfessionalTitle() != null) sb.append(profile.getProfessionalTitle()).append(" ");
        if (profile.getEducation() != null) sb.append(profile.getEducation()).append(" ");
        if (profile.getProfessionalSummary() != null) sb.append(profile.getProfessionalSummary()).append(" ");
        if (profile.getLocation() != null) sb.append(profile.getLocation()).append(" ");
        if (profile.getSkills() != null) sb.append(String.join(" ", profile.getSkills())).append(" ");
        if (profile.getCertifications() != null) sb.append(String.join(" ", profile.getCertifications())).append(" ");
        return sb.toString().toLowerCase();
    }

    /**
     * Analyze job relevance based on profile.
     */
    private double analyzeJobRelevance(Job job, ApplicantProfile profile) {
        String jobText = (job.getTitle() + " " + job.getDescription()).toLowerCase();
        String profileText = buildProfileText(profile);

        // Simple word overlap analysis
        Set<String> jobWords = new HashSet<>(Arrays.asList(jobText.split("\\s+")));
        Set<String> profileWords = new HashSet<>(Arrays.asList(profileText.split("\\s+")));

        // Remove common stop words
        Set<String> stopWords = Set.of("the", "a", "an", "and", "or", "is", "in", "at", "to", "for",
                "of", "with", "on", "by", "as", "be", "that", "this", "it", "from", "will", "are",
                "we", "you", "can", "should", "must", "our", "their", "have", "has");
        jobWords.removeAll(stopWords);
        profileWords.removeAll(stopWords);

        if (jobWords.isEmpty()) return 70.0;

        long overlap = jobWords.stream().filter(profileWords::contains).count();
        double relevance = (overlap * 100.0 / jobWords.size());
        return Math.min(relevance * 2, 100.0); // Scale up slightly since word overlap underestimates
    }

    /**
     * Calculate the overall match score from individual components.
     */
    private double calculateOverallScore(double skills, double experience, double qualification,
                                          double mandatory, double relevance) {
        // Weighted scoring: mandatory criteria is most important
        if (mandatory == 0.0) return 0.0; // Failed mandatory = fail

        return skills * 0.30
                + experience * 0.20
                + qualification * 0.15
                + mandatory * 0.20
                + relevance * 0.15;
    }

    /**
     * Analyze text content for AI-generated indicators.
     * Uses heuristic-based analysis — never claims certainty.
     */
    public Map<String, Object> analyzeContentAuthenticity(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Map.of("riskLevel", ContentRiskLevel.LOW, "confidence", 0.1);
        }

        String textLower = text.toLowerCase();
        int indicatorCount = 0;

        // Check for AI buzzword patterns
        for (String indicator : AI_INDICATORS) {
            if (textLower.contains(indicator)) indicatorCount++;
        }

        // Check for fabrication indicators
        for (String indicator : FABRICATION_INDICATORS) {
            if (textLower.contains(indicator)) indicatorCount += 3;
        }

        // Check for suspiciously perfect structure
        String[] sentences = text.split("[.!?]+");
        double avgSentenceLength = Arrays.stream(sentences)
                .mapToInt(s -> s.trim().split("\\s+").length)
                .average()
                .orElse(0);

        // AI text tends to have uniform sentence lengths
        double sentenceLengthVariance = 0;
        if (sentences.length > 2) {
            double mean = avgSentenceLength;
            sentenceLengthVariance = Arrays.stream(sentences)
                    .mapToDouble(s -> Math.pow(s.trim().split("\\s+").length - mean, 2))
                    .average()
                    .orElse(0);
        }
        if (sentenceLengthVariance < 5 && sentences.length > 3) indicatorCount++;

        // Check for excessive formality markers
        long formalityMarkers = Arrays.stream(
                new String[]{"furthermore", "moreover", "consequently", "subsequently", "henceforth"})
                .filter(textLower::contains)
                .count();
        if (formalityMarkers >= 2) indicatorCount++;

        // Calculate confidence
        ContentRiskLevel riskLevel;
        double confidence;

        if (indicatorCount >= 5) {
            riskLevel = ContentRiskLevel.HIGH;
            confidence = Math.min(0.75, 0.5 + indicatorCount * 0.05);
        } else if (indicatorCount >= 2) {
            riskLevel = ContentRiskLevel.MEDIUM;
            confidence = 0.3 + indicatorCount * 0.08;
        } else {
            riskLevel = ContentRiskLevel.LOW;
            confidence = 0.1 + indicatorCount * 0.05;
        }

        return Map.of("riskLevel", riskLevel, "confidence", confidence);
    }

    /**
     * Analyze a screening answer for relevance and AI content.
     */
    public Map<String, Object> analyzeScreeningAnswer(String question, String answer) {
        Map<String, Object> result = new HashMap<>();

        // AI content analysis
        Map<String, Object> aiAnalysis = analyzeContentAuthenticity(answer);
        result.put("aiContentRisk", aiAnalysis.get("riskLevel"));
        result.put("aiConfidence", aiAnalysis.get("confidence"));

        // Relevance analysis
        double relevance = analyzeAnswerRelevance(question, answer);
        result.put("relevanceScore", relevance);

        String evaluationStatus;
        if (relevance >= 60) {
            evaluationStatus = "RELEVANT";
        } else if (relevance >= 30) {
            evaluationStatus = "NEEDS_REVIEW";
        } else {
            evaluationStatus = "IRRELEVANT";
        }
        result.put("evaluationStatus", evaluationStatus);

        String explanation;
        if (evaluationStatus.equals("RELEVANT")) {
            explanation = "Answer appears relevant to the question and addresses the key topic.";
        } else if (evaluationStatus.equals("NEEDS_REVIEW")) {
            explanation = "Answer partially addresses the question but may need manual review for completeness.";
        } else {
            explanation = "Answer does not appear to address the question. The response may be off-topic or generic.";
        }
        result.put("evaluationExplanation", explanation);

        return result;
    }

    /**
     * Analyze how relevant an answer is to the given question.
     */
    private double analyzeAnswerRelevance(String question, String answer) {
        if (answer == null || answer.trim().length() < 10) return 10.0;
        if (question == null || question.trim().isEmpty()) return 70.0;

        String qLower = question.toLowerCase();
        String aLower = answer.toLowerCase();

        // Extract key terms from question (remove stop words)
        Set<String> stopWords = Set.of("the", "a", "an", "and", "or", "is", "in", "at", "to", "for",
                "of", "with", "on", "by", "your", "you", "what", "how", "why", "explain",
                "describe", "tell", "us", "about", "do", "have", "has", "are", "can", "would");

        Set<String> questionKeywords = new HashSet<>(Arrays.asList(qLower.split("\\s+")));
        questionKeywords.removeAll(stopWords);
        questionKeywords.removeIf(w -> w.length() < 3);

        if (questionKeywords.isEmpty()) return 60.0;

        // Count how many question keywords appear in the answer
        long matchCount = questionKeywords.stream()
                .filter(aLower::contains)
                .count();

        double baseRelevance = (matchCount * 100.0 / questionKeywords.size());

        // Bonus for answer length (short answers are suspicious)
        int wordCount = answer.trim().split("\\s+").length;
        double lengthBonus = 0;
        if (wordCount >= 20) lengthBonus = 10;
        if (wordCount >= 50) lengthBonus = 20;

        return Math.min(100.0, baseRelevance + lengthBonus);
    }

    public ScreeningResult getResultByApplicationId(String applicationId) {
        return screeningResultRepository.findByApplicationId(applicationId).orElse(null);
    }
}
