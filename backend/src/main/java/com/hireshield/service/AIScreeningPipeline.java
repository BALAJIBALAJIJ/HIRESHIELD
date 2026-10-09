package com.hireshield.service;

import com.hireshield.model.*;
import com.hireshield.model.enums.ApplicationStatus;
import com.hireshield.model.enums.ContentRiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Screening Pipeline — uses Gemini for deep analysis with heuristic fallback.
 * Pipeline: Resume Analysis → Profile Comparison → Job Matching → Mandatory Validation
 *           → AI Content Risk → Answer Analysis → Cross-Validation → Final Decision
 */
@Service
public class AIScreeningPipeline {

    private static final Logger log = LoggerFactory.getLogger(AIScreeningPipeline.class);
    private final GeminiService geminiService;

    public AIScreeningPipeline(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    // ===== 1. RESUME ANALYSIS PROMPT =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeResume(String resumeBase64, String mimeType) {
        String prompt = """
            You are an expert resume analyzer for the HireShield recruitment platform.
            
            Analyze the uploaded resume document and extract ALL structured information.
            
            Return a JSON object with EXACTLY these fields:
            {
              "fullName": "string",
              "email": "string or null",
              "phone": "string or null",
              "location": "string or null",
              "professionalSummary": "string or null",
              "education": [{"degree": "string", "university": "string", "graduationYear": "string or null", "field": "string or null"}],
              "skills": {"programmingLanguages": [], "frameworks": [], "databases": [], "tools": [], "cloud": [], "other": []},
              "certifications": [],
              "projects": [{"name": "string", "description": "string", "technologies": []}],
              "workExperience": [{"title": "string", "company": "string", "duration": "string", "description": "string or null"}],
              "internships": [{"title": "string", "company": "string", "duration": "string"}],
              "achievements": [],
              "portfolioUrl": "string or null",
              "linkedinUrl": "string or null",
              "githubUrl": "string or null",
              "totalYearsOfExperience": 0,
              "allSkillsList": [],
              "resumeQualityScore": 0,
              "suspiciousIndicators": [],
              "authenticityRisk": "LOW or MEDIUM or HIGH",
              "authenticityExplanation": "string"
            }
            
            IMPORTANT:
            - Extract REAL information, do not fabricate data
            - allSkillsList should be a flat list of ALL skills found anywhere in the resume
            - resumeQualityScore: 0-100 based on completeness and professionalism
            - suspiciousIndicators: list any impossible timelines, overlapping jobs, contradictions
            - authenticityRisk: LOW if resume appears genuine, MEDIUM if some concerns, HIGH if serious issues
            - Be thorough but fair. Professional language is NOT suspicious.
            """;

        if (resumeBase64 != null && !resumeBase64.isEmpty()) {
            Map<String, Object> result = geminiService.analyzeResumeWithGemini(resumeBase64, mimeType, prompt);
            if (result != null && !result.containsKey("rawResponse")) {
                return result;
            }
        }
        // Return empty structure if Gemini fails
        return createEmptyResumeAnalysis();
    }

    // ===== 2. PROFILE-RESUME CONSISTENCY CHECK =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> checkProfileResumeConsistency(ApplicantProfile profile, Map<String, Object> resumeData) {
        String prompt = String.format("""
            You are a consistency checker for the HireShield recruitment platform.
            
            Compare the Applicant's REGISTERED PROFILE with the RESUME data and identify inconsistencies.
            
            APPLICANT PROFILE:
            - Name: %s
            - Professional Title: %s
            - Education: %s
            - Skills: %s
            - Experience: %d years
            - Location: %s
            - LinkedIn: %s
            - GitHub: %s
            
            RESUME EXTRACTED DATA:
            %s
            
            Return JSON:
            {
              "consistencyScore": 0-100,
              "inconsistencies": [
                {"field": "string", "profileValue": "string", "resumeValue": "string", "severity": "LOW/MEDIUM/HIGH", "explanation": "string"}
              ],
              "overallAssessment": "CONSISTENT or MINOR_DISCREPANCIES or SIGNIFICANT_INCONSISTENCIES",
              "explanation": "string"
            }
            
            RULES:
            - Minor formatting differences (e.g., "B.E" vs "Bachelor of Engineering") are NOT inconsistencies
            - Name spelling variations are LOW severity
            - Experience difference of 1 year is LOW, 2+ years is MEDIUM, 5+ years is HIGH
            - Missing skills in resume that are in profile: MEDIUM
            - Completely different person name: HIGH
            - Be fair. Do NOT flag normal resume formatting differences.
            """,
            profile.getFullName(), profile.getProfessionalTitle(), profile.getEducation(),
            profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "none",
            profile.getYearsOfExperience(), profile.getLocation(),
            profile.getLinkedinUrl(), profile.getGithubUrl(),
            resumeData.toString()
        );

        Map<String, Object> result = geminiService.analyzeWithGemini(prompt);
        if (result != null) return result;

        // Fallback
        return Map.of("consistencyScore", 85, "inconsistencies", List.of(),
                "overallAssessment", "CONSISTENT", "explanation", "Basic consistency check passed (AI analysis unavailable).");
    }

    // ===== 3. JOB MATCHING =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> matchResumeToJob(Map<String, Object> resumeData, ApplicantProfile profile, Job job) {
        StringBuilder criteria = new StringBuilder();
        if (job.getScreeningCriteria() != null) {
            for (Job.ScreeningCriterion c : job.getScreeningCriteria()) {
                criteria.append(String.format("- [%s] %s: %s\n", c.getType(), c.getCategory(), c.getRequirement()));
            }
        }

        String prompt = String.format("""
            You are a job matching AI for the HireShield recruitment platform.
            
            Evaluate how well the candidate matches the job requirements using SEMANTIC understanding.
            Do NOT rely only on exact keyword matches. Understand context and relevance.
            
            JOB:
            - Title: %s
            - Description: %s
            - Required Skills: %s
            - Required Experience: %s
            - Required Qualification: %s
            - Location: %s
            - Work Mode: %s
            
            SCREENING CRITERIA:
            %s
            
            CANDIDATE PROFILE:
            - Name: %s
            - Title: %s
            - Education: %s
            - Skills: %s
            - Experience: %d years
            
            RESUME DATA:
            %s
            
            Return JSON:
            {
              "jobMatchScore": 0-100,
              "skillsMatchScore": 0-100,
              "experienceMatchScore": 0-100,
              "qualificationMatchScore": 0-100,
              "mandatoryCriteriaSatisfied": true/false,
              "mandatoryScore": 0-100,
              "preferredScore": 0-100,
              "matchedSkills": [],
              "missingSkills": [],
              "criteriaResults": [
                {"category": "string", "requirement": "string", "type": "MANDATORY/PREFERRED", "satisfied": true/false, "explanation": "string", "confidence": 0.0-1.0}
              ],
              "failedMandatory": [],
              "strengths": [],
              "gaps": [],
              "explanation": "string"
            }
            
            RULES:
            - "Developed REST APIs using Spring Boot" IS relevant to "Spring Boot" skill
            - Semantic matching: related technologies count (e.g., "React" matches "Frontend Development")
            - Every score MUST be derived from actual evidence, never random
            - If mandatory criteria fail, mandatoryCriteriaSatisfied MUST be false
            - failedMandatory: list the exact mandatory requirements that were NOT met
            """,
            job.getTitle(), job.getDescription(),
            job.getRequiredSkills() != null ? String.join(", ", job.getRequiredSkills()) : "none",
            job.getRequiredExperience(), job.getRequiredQualification(),
            job.getLocation(), job.getWorkMode(),
            criteria.toString(),
            profile.getFullName(), profile.getProfessionalTitle(), profile.getEducation(),
            profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "none",
            profile.getYearsOfExperience(),
            resumeData.toString()
        );

        Map<String, Object> result = geminiService.analyzeWithGemini(prompt);
        if (result != null) return result;

        // Fallback — basic matching
        return createFallbackJobMatch(profile, job);
    }

    // ===== 4. ANSWER ANALYSIS =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeAnswer(String question, String answer, Job job, ApplicantProfile profile, Map<String, Object> resumeData) {
        String prompt = String.format("""
            You are a screening answer analyzer for the HireShield recruitment platform.
            
            Analyze the applicant's answer to a screening question.
            
            JOB: %s - %s
            REQUIRED SKILLS: %s
            
            APPLICANT PROFILE:
            - Name: %s, Title: %s, Skills: %s, Experience: %d years
            
            RESUME SUMMARY: %s
            
            SCREENING QUESTION: %s
            
            APPLICANT'S ANSWER: %s
            
            Return JSON:
            {
              "relevanceScore": 0-100,
              "technicalAccuracy": 0-100,
              "profileConsistency": 0-100,
              "aiGenerationRiskScore": 0-100,
              "aiContentRisk": "LOW/MEDIUM/HIGH",
              "copyPasteRisk": "LOW/MEDIUM/HIGH",
              "answerQuality": "EXCELLENT/GOOD/AVERAGE/POOR/IRRELEVANT",
              "isRelevant": true/false,
              "explanation": "string",
              "consistencyNotes": "string"
            }
            
            RULES:
            - relevanceScore: Does the answer actually address the question?
            - technicalAccuracy: Is the technical content correct?
            - profileConsistency: Does the answer match what's in their profile/resume?
            - aiGenerationRiskScore: Probability the answer was AI-generated (0-100)
            - AI detection is PROBABILISTIC. Professional writing is NOT automatically suspicious.
            - A well-written, specific answer with real project examples is LIKELY genuine.
            - A generic, buzzword-heavy answer with no specifics is MORE suspicious.
            - "I enjoy working in teams and I am passionate about technology" for a Spring Boot question = IRRELEVANT
            """,
            job.getTitle(), job.getDescription() != null ? job.getDescription().substring(0, Math.min(200, job.getDescription().length())) : "",
            job.getRequiredSkills() != null ? String.join(", ", job.getRequiredSkills()) : "none",
            profile.getFullName(), profile.getProfessionalTitle(),
            profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "none",
            profile.getYearsOfExperience(),
            resumeData != null ? resumeData.toString().substring(0, Math.min(500, resumeData.toString().length())) : "not available",
            question, answer
        );

        Map<String, Object> result = geminiService.analyzeWithGemini(prompt);
        if (result != null) return result;

        // Fallback
        return Map.of("relevanceScore", 60, "technicalAccuracy", 60, "profileConsistency", 70,
                "aiGenerationRiskScore", 20, "aiContentRisk", "LOW", "copyPasteRisk", "LOW",
                "answerQuality", "AVERAGE", "isRelevant", true,
                "explanation", "Basic analysis (AI service unavailable).", "consistencyNotes", "");
    }

    // ===== 5. CROSS-VALIDATION (Profile + Resume + Answers) =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> crossValidate(ApplicantProfile profile, Map<String, Object> resumeData,
                                              List<Map<String, String>> questionsAndAnswers, Job job) {
        StringBuilder qaText = new StringBuilder();
        if (questionsAndAnswers != null) {
            for (Map<String, String> qa : questionsAndAnswers) {
                qaText.append("Q: ").append(qa.get("question")).append("\n");
                qaText.append("A: ").append(qa.get("answer")).append("\n\n");
            }
        }

        String prompt = String.format("""
            You are a cross-validation AI for the HireShield recruitment platform.
            
            Compare the applicant's PROFILE, RESUME, and SCREENING ANSWERS for contradictions.
            
            PROFILE:
            - Name: %s, Title: %s, Education: %s
            - Skills: %s, Experience: %d years
            
            RESUME DATA:
            %s
            
            SCREENING Q&A:
            %s
            
            JOB: %s
            
            Return JSON:
            {
              "crossValidationScore": 0-100,
              "isConsistent": true/false,
              "contradictions": [
                {"source1": "PROFILE/RESUME/ANSWER", "source2": "PROFILE/RESUME/ANSWER", "field": "string", "value1": "string", "value2": "string", "severity": "LOW/MEDIUM/HIGH", "explanation": "string"}
              ],
              "overallAssessment": "CONSISTENT/MINOR_ISSUES/MAJOR_CONTRADICTIONS",
              "explanation": "string"
            }
            
            Example contradiction:
            Profile says "3 years Java" but answer says "I have never worked with Java" = HIGH severity
            Profile says "3 years Java" and answer says "approximately 3 years of Java" = CONSISTENT
            """,
            profile.getFullName(), profile.getProfessionalTitle(), profile.getEducation(),
            profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "none",
            profile.getYearsOfExperience(),
            resumeData.toString().substring(0, Math.min(1000, resumeData.toString().length())),
            qaText.toString().substring(0, Math.min(1000, qaText.toString().length())),
            job.getTitle()
        );

        Map<String, Object> result = geminiService.analyzeWithGemini(prompt);
        if (result != null) return result;

        return Map.of("crossValidationScore", 80, "isConsistent", true, "contradictions", List.of(),
                "overallAssessment", "CONSISTENT", "explanation", "Basic validation passed (AI unavailable).");
    }

    // ===== 6. FINAL SCREENING DECISION =====
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateFinalDecision(Map<String, Object> jobMatch, Map<String, Object> profileConsistency,
                                                      Map<String, Object> crossValidation, Map<String, Object> resumeAnalysis,
                                                      List<Map<String, Object>> answerAnalyses) {
        String prompt = String.format("""
            You are the FINAL screening decision maker for the HireShield recruitment platform.
            
            Based on ALL the analysis results below, generate a final screening decision.
            
            JOB MATCH RESULTS: %s
            PROFILE-RESUME CONSISTENCY: %s
            CROSS-VALIDATION RESULTS: %s
            RESUME ANALYSIS: %s
            ANSWER ANALYSES: %s
            
            Return JSON:
            {
              "decision": "ELIGIBLE/NEEDS_REVIEW/REJECTED",
              "jobMatchScore": 0-100,
              "skillsMatchScore": 0-100,
              "experienceMatchScore": 0-100,
              "qualificationMatchScore": 0-100,
              "mandatoryScore": 0-100,
              "preferredScore": 0-100,
              "resumeAuthenticityRisk": "LOW/MEDIUM/HIGH",
              "aiContentRisk": "LOW/MEDIUM/HIGH",
              "answerRelevanceScore": 0-100,
              "profileResumeConsistencyScore": 0-100,
              "crossValidationScore": 0-100,
              "needsHumanReview": true/false,
              "mandatoryRequirementsSatisfied": true/false,
              "failedRequirements": [],
              "warnings": [],
              "reasons": [],
              "rejectionReason": "string or null"
            }
            
            DECISION RULES:
            1. REJECTED: Mandatory requirements not satisfied OR serious verified inconsistency
            2. NEEDS_REVIEW: Potential issues found (high AI risk, moderate inconsistencies, uncertain match)
            3. ELIGIBLE: All mandatory requirements met, no critical issues
            
            CRITICAL: Do NOT reject ONLY because:
            - Resume uses professional language
            - Answer is well-written
            - AI detector gives high score without other evidence
            
            AI content risk should normally result in NEEDS_REVIEW, not REJECTED.
            The strongest rejection reasons must be OBJECTIVE: missing mandatory skill, missing qualification, etc.
            """,
            jobMatch, profileConsistency, crossValidation,
            resumeAnalysis != null ? resumeAnalysis.toString().substring(0, Math.min(500, resumeAnalysis.toString().length())) : "unavailable",
            answerAnalyses
        );

        Map<String, Object> result = geminiService.analyzeWithGemini(prompt);
        if (result != null) return result;

        // Fallback using jobMatch data
        return createFallbackDecision(jobMatch);
    }

    // ===== FALLBACK HELPERS =====

    private Map<String, Object> createEmptyResumeAnalysis() {
        Map<String, Object> result = new HashMap<>();
        result.put("fullName", "");
        result.put("allSkillsList", List.of());
        result.put("totalYearsOfExperience", 0);
        result.put("resumeQualityScore", 50);
        result.put("authenticityRisk", "LOW");
        result.put("authenticityExplanation", "Resume analysis unavailable — using profile data.");
        result.put("suspiciousIndicators", List.of());
        return result;
    }

    private Map<String, Object> createFallbackJobMatch(ApplicantProfile profile, Job job) {
        Map<String, Object> result = new HashMap<>();
        List<String> matched = new ArrayList<>(), missing = new ArrayList<>();

        if (job.getRequiredSkills() != null && profile.getSkills() != null) {
            Set<String> profileSkillsLower = profile.getSkills().stream().map(String::toLowerCase).collect(Collectors.toSet());
            for (String skill : job.getRequiredSkills()) {
                if (profileSkillsLower.stream().anyMatch(ps -> ps.contains(skill.toLowerCase()) || skill.toLowerCase().contains(ps))) {
                    matched.add(skill);
                } else {
                    missing.add(skill);
                }
            }
        }

        int total = matched.size() + missing.size();
        int skillsScore = total > 0 ? (matched.size() * 100 / total) : 70;

        result.put("jobMatchScore", skillsScore);
        result.put("skillsMatchScore", skillsScore);
        result.put("experienceMatchScore", 70);
        result.put("qualificationMatchScore", 70);
        result.put("mandatoryCriteriaSatisfied", true);
        result.put("mandatoryScore", 100);
        result.put("preferredScore", 70);
        result.put("matchedSkills", matched);
        result.put("missingSkills", missing);
        result.put("criteriaResults", List.of());
        result.put("failedMandatory", List.of());
        result.put("strengths", List.of("Profile skills partially match requirements"));
        result.put("gaps", missing.isEmpty() ? List.of() : List.of("Some required skills not found in profile"));
        result.put("explanation", "Basic matching performed (Gemini unavailable). Skills match: " + skillsScore + "%");
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> createFallbackDecision(Map<String, Object> jobMatch) {
        Map<String, Object> result = new HashMap<>();
        int score = getInt(jobMatch, "jobMatchScore", 70);
        boolean mandatorySatisfied = getBool(jobMatch, "mandatoryCriteriaSatisfied", true);

        String decision;
        if (!mandatorySatisfied) decision = "REJECTED";
        else if (score >= 70) decision = "ELIGIBLE";
        else if (score >= 50) decision = "NEEDS_REVIEW";
        else decision = "REJECTED";

        result.put("decision", decision);
        result.put("jobMatchScore", score);
        result.put("skillsMatchScore", getInt(jobMatch, "skillsMatchScore", 70));
        result.put("experienceMatchScore", getInt(jobMatch, "experienceMatchScore", 70));
        result.put("qualificationMatchScore", getInt(jobMatch, "qualificationMatchScore", 70));
        result.put("mandatoryScore", getInt(jobMatch, "mandatoryScore", 100));
        result.put("preferredScore", getInt(jobMatch, "preferredScore", 70));
        result.put("resumeAuthenticityRisk", "LOW");
        result.put("aiContentRisk", "LOW");
        result.put("answerRelevanceScore", 70);
        result.put("profileResumeConsistencyScore", 85);
        result.put("crossValidationScore", 80);
        result.put("needsHumanReview", decision.equals("NEEDS_REVIEW"));
        result.put("mandatoryRequirementsSatisfied", mandatorySatisfied);
        result.put("failedRequirements", jobMatch.getOrDefault("failedMandatory", List.of()));
        result.put("warnings", List.of());
        result.put("reasons", List.of("Screening completed with basic analysis (AI service unavailable)."));
        result.put("rejectionReason", decision.equals("REJECTED")
                ? "Application does not meet minimum requirements. " + jobMatch.getOrDefault("explanation", "")
                : null);
        return result;
    }

    private int getInt(Map<String, Object> map, String key, int fallback) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        return fallback;
    }

    private boolean getBool(Map<String, Object> map, String key, boolean fallback) {
        Object val = map.get(key);
        if (val instanceof Boolean) return (Boolean) val;
        return fallback;
    }
}
