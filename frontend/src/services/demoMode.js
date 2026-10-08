/**
 * HireShield Demo Mode — Mock API Service
 * Simulates backend responses for hackathon demonstration.
 * Provides full CRUD operations with localStorage persistence.
 */

const DEMO_DELAY = 400; // ms to simulate network latency

// ===== Demo Data Store (localStorage-backed) =====
function getStore() {
  const raw = localStorage.getItem('hireshield_demo');
  if (raw) return JSON.parse(raw);
  const initial = createInitialData();
  localStorage.setItem('hireshield_demo', JSON.stringify(initial));
  return initial;
}

function saveStore(store) {
  localStorage.setItem('hireshield_demo', JSON.stringify(store));
}

function genId() {
  return 'hs_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function delay(data) {
  return new Promise(resolve => setTimeout(() => resolve(data), DEMO_DELAY));
}

function success(message, data = null) {
  return { data: { success: true, message, data } };
}

function error(message) {
  return Promise.reject({ response: { data: { success: false, message } } });
}

// ===== AI Screening Engine (Client-Side) =====
const AI_INDICATORS = [
  'leveraged', 'spearheaded', 'orchestrated', 'synergized', 'facilitated',
  'utilized cutting-edge', 'drove innovation', 'passionate about',
  'results-driven professional', 'proven track record',
  'detail-oriented', 'self-motivated', 'team player',
  'highly motivated', 'dynamic professional'
];

function analyzeContentAuthenticity(text) {
  if (!text || text.trim().length < 10) return { riskLevel: 'LOW', confidence: 0.1 };
  const lower = text.toLowerCase();
  let count = 0;
  AI_INDICATORS.forEach(ind => { if (lower.includes(ind)) count++; });
  if (lower.includes('lorem ipsum') || lower.includes('placeholder')) count += 3;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length > 3) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, l) => a + Math.pow(l - avg, 2), 0) / lengths.length;
    if (variance < 5) count++;
  }

  if (count >= 5) return { riskLevel: 'HIGH', confidence: Math.min(0.75, 0.5 + count * 0.05) };
  if (count >= 2) return { riskLevel: 'MEDIUM', confidence: 0.3 + count * 0.08 };
  return { riskLevel: 'LOW', confidence: 0.1 + count * 0.05 };
}

function screenApplication(application, job, profile) {
  // Skills matching
  const reqSkills = job.requiredSkills || [];
  const candSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
  const matchedSkills = [];
  const missingSkills = [];
  reqSkills.forEach(skill => {
    const sl = skill.toLowerCase().trim();
    if (candSkills.some(cs => cs.includes(sl) || sl.includes(cs))) matchedSkills.push(skill);
    else missingSkills.push(skill);
  });
  const skillsScore = reqSkills.length > 0 ? (matchedSkills.length * 100 / reqSkills.length) : 80;

  // Experience matching
  let experienceScore = 80;
  if (job.requiredExperience) {
    const digits = job.requiredExperience.replace(/[^0-9]/g, '');
    if (digits) {
      const reqYears = parseInt(digits);
      if (profile.yearsOfExperience >= reqYears) experienceScore = 100;
      else if (profile.yearsOfExperience >= reqYears - 1) experienceScore = 75;
      else experienceScore = Math.max(20, (profile.yearsOfExperience * 100 / reqYears));
    }
  }

  // Qualification matching
  let qualificationScore = 80;
  if (job.requiredQualification && profile.education) {
    const reqL = job.requiredQualification.toLowerCase();
    const candL = profile.education.toLowerCase();
    const aliases = {
      'b.e': ['be', 'b.e', 'btech', 'b.tech', 'bachelor'],
      'b.tech': ['btech', 'b.tech', 'be', 'b.e', 'bachelor'],
      'm.tech': ['mtech', 'm.tech', 'master'],
      'mba': ['mba', 'master of business'],
      'mca': ['mca', 'master of computer'],
      'bca': ['bca', 'bachelor of computer'],
      'bsc': ['bsc', 'b.sc', 'bachelor of science'],
    };
    let matched = false;
    for (const [, alts] of Object.entries(aliases)) {
      if (alts.some(a => reqL.includes(a)) && alts.some(a => candL.includes(a))) { matched = true; break; }
    }
    qualificationScore = matched ? 100 : (candL.includes(reqL) || reqL.includes(candL) ? 90 : 40);
  }

  // Mandatory criteria
  const criteriaResults = [];
  let mandatoryFailed = false;
  (job.screeningCriteria || []).forEach(criterion => {
    const req = criterion.requirement?.toLowerCase().trim() || '';
    const cat = criterion.category?.toLowerCase() || '';
    let satisfied = false;

    if (cat.includes('skill') || cat.includes('programming') || cat.includes('technical')) {
      satisfied = candSkills.some(s => s.includes(req) || req.includes(s));
    } else if (cat.includes('degree') || cat.includes('qualification') || cat.includes('education')) {
      satisfied = profile.education && (profile.education.toLowerCase().includes(req) || req.includes(profile.education.toLowerCase()));
    } else if (cat.includes('experience')) {
      const d = req.replace(/[^0-9]/g, '');
      satisfied = d ? profile.yearsOfExperience >= parseInt(d) : true;
    } else if (cat.includes('certification')) {
      satisfied = (profile.certifications || []).some(c => c.toLowerCase().includes(req));
    } else {
      const profileText = [profile.fullName, profile.professionalTitle, profile.education, profile.professionalSummary, ...(profile.skills || [])].join(' ').toLowerCase();
      satisfied = profileText.includes(req);
    }

    if (criterion.type === 'MANDATORY' && !satisfied) mandatoryFailed = true;

    criteriaResults.push({
      category: criterion.category,
      requirement: criterion.requirement,
      type: criterion.type,
      satisfied,
      explanation: satisfied
        ? `Candidate satisfies the ${criterion.category} requirement: ${criterion.requirement}`
        : `Candidate does not satisfy the ${criterion.category} requirement: ${criterion.requirement}`,
      confidence: satisfied ? 0.85 : 0.80,
    });
  });

  const mandatoryScore = mandatoryFailed ? 0 : 100;

  // Job relevance
  const jobText = ((job.title || '') + ' ' + (job.description || '')).toLowerCase().split(/\s+/);
  const profileText = [profile.professionalTitle, profile.professionalSummary, ...(profile.skills || [])].filter(Boolean).join(' ').toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'in', 'to', 'for', 'of', 'with', 'on', 'we', 'are', 'will', 'you']);
  const jobWords = new Set(jobText.filter(w => w.length > 2 && !stopWords.has(w)));
  const profileWords = new Set(profileText);
  const overlap = [...jobWords].filter(w => profileWords.has(w)).length;
  const relevanceScore = jobWords.size > 0 ? Math.min(100, (overlap * 100 / jobWords.size) * 2) : 70;

  // AI content analysis
  const aiAnalysis = analyzeContentAuthenticity(profile.professionalSummary || '');

  // Overall score
  const overallScore = mandatoryScore === 0 ? 0 :
    skillsScore * 0.30 + experienceScore * 0.20 + qualificationScore * 0.15 + mandatoryScore * 0.20 + relevanceScore * 0.15;

  // Status determination
  let status, explanation;
  if (mandatoryFailed) {
    status = 'REJECTED';
    const failed = criteriaResults.filter(c => c.type === 'MANDATORY' && !c.satisfied).map(c => c.explanation).join('; ');
    explanation = `Application rejected: Mandatory requirements not satisfied. ${failed}`;
  } else if (aiAnalysis.riskLevel === 'HIGH') {
    status = 'NEEDS_REVIEW';
    explanation = `Candidate meets requirements but resume content shows high AI-generated likelihood (confidence: ${Math.round(aiAnalysis.confidence * 100)}%). Manual review recommended.`;
  } else if (overallScore >= 70) {
    status = 'ELIGIBLE';
    explanation = `Candidate matches the job requirements with a score of ${Math.round(overallScore)}%. Skills, experience, and qualifications align well.`;
  } else if (overallScore >= 50) {
    status = 'NEEDS_REVIEW';
    explanation = `Candidate partially matches requirements (score: ${Math.round(overallScore)}%). Manual review recommended.`;
  } else {
    status = 'REJECTED';
    explanation = `Application does not meet minimum requirements. Match score: ${Math.round(overallScore)}%. Key gaps: ${missingSkills.length > 0 ? missingSkills.join(', ') : 'general mismatch'}`;
  }

  return {
    id: genId(), applicationId: application.id, jobId: job.id,
    recommendedStatus: status, overallScore, overallExplanation: explanation,
    criteriaResults, matchedSkills, missingSkills,
    resumeContentRisk: aiAnalysis.riskLevel, resumeAiConfidence: aiAnalysis.confidence,
    matchScore: {
      overall: overallScore, skillsMatch: skillsScore, experienceMatch: experienceScore,
      qualificationMatch: qualificationScore, mandatoryCriteriaMatch: mandatoryScore,
      jobRelevance: relevanceScore, explanation,
    },
  };
}

// ===== Initial Demo Data =====
function createInitialData() {
  const orgId = genId();
  const hiringUserId = genId();
  const applicant1Id = genId();
  const applicant2Id = genId();
  const job1Id = genId();
  const job2Id = genId();

  return {
    users: [
      {
        id: hiringUserId, email: 'demo@hireshield.com', password: 'demo123',
        fullName: 'Demo Recruiter', role: 'HIRING_TEAM', organizationId: orgId,
        createdAt: new Date().toISOString(),
      },
      {
        id: applicant1Id, email: 'applicant@hireshield.com', password: 'demo123',
        fullName: 'Arun Kumar', role: 'APPLICANT',
        createdAt: new Date().toISOString(),
      },
      {
        id: applicant2Id, email: 'priya@hireshield.com', password: 'demo123',
        fullName: 'Priya Sharma', role: 'APPLICANT',
        createdAt: new Date().toISOString(),
      },
    ],
    organizations: [
      {
        id: orgId, companyName: 'TechCorp India', industry: 'Technology',
        companySize: '51-200', companyWebsite: 'https://techcorp.in',
        companyLocation: 'Bangalore, India', companyDescription: 'Leading technology solutions company.',
        companyLogoUrl: null,
      },
    ],
    hiringTeamProfiles: [
      {
        id: genId(), userId: hiringUserId, fullName: 'Demo Recruiter',
        designation: 'Senior Technical Recruiter', department: 'Human Resources',
        yearsOfExperience: 5, bio: 'Experienced in tech hiring.',
        profilePhotoUrl: null,
      },
    ],
    applicantProfiles: [
      {
        id: genId(), userId: applicant1Id, fullName: 'Arun Kumar',
        professionalTitle: 'Full Stack Developer', phone: '+91 9876543210',
        location: 'Chennai, India', education: 'B.Tech Computer Science',
        skills: ['Java', 'Spring Boot', 'React', 'MongoDB', 'Python', 'Docker'],
        yearsOfExperience: 3, professionalSummary: 'Passionate full-stack developer with 3 years of experience building web applications using Java, Spring Boot, and React. Strong problem-solving skills.',
        certifications: ['AWS Certified Developer'], portfolioUrl: '', githubUrl: 'https://github.com/arunkumar',
        linkedinUrl: 'https://linkedin.com/in/arunkumar', resumeUrl: null, resumeFileName: null, profilePhotoUrl: null,
      },
      {
        id: genId(), userId: applicant2Id, fullName: 'Priya Sharma',
        professionalTitle: 'Frontend Developer', phone: '+91 9988776655',
        location: 'Mumbai, India', education: 'MCA',
        skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Node.js'],
        yearsOfExperience: 2, professionalSummary: 'Creative frontend developer specializing in React and modern JavaScript frameworks.',
        certifications: [], portfolioUrl: 'https://priya.dev', githubUrl: '',
        linkedinUrl: '', resumeUrl: null, resumeFileName: null, profilePhotoUrl: null,
      },
    ],
    jobs: [
      {
        id: job1Id, organizationId: orgId, publishedByUserId: hiringUserId,
        title: 'Senior Java Developer', description: 'We are looking for an experienced Java developer to join our backend engineering team. You will design and build microservices using Spring Boot, implement REST APIs, and work with MongoDB and PostgreSQL databases.\n\nResponsibilities:\n- Design and implement scalable microservices\n- Write clean, testable code\n- Collaborate with frontend and DevOps teams\n- Participate in code reviews and architecture discussions',
        requiredSkills: ['Java', 'Spring Boot', 'MongoDB', 'REST APIs', 'Microservices'],
        requiredExperience: '2+ years', requiredQualification: 'B.E/B.Tech',
        location: 'Bangalore, India', workMode: 'HYBRID', salary: '₹8-15 LPA',
        employmentType: 'FULL_TIME', numberOfOpenings: 3, published: true, active: true,
        applicationDeadline: '2026-12-31',
        screeningCriteria: [
          { category: 'Programming Language', requirement: 'Java', type: 'MANDATORY' },
          { category: 'Technical Skill', requirement: 'Spring Boot', type: 'MANDATORY' },
          { category: 'Degree', requirement: 'B.E/B.Tech', type: 'MANDATORY' },
          { category: 'Technical Skill', requirement: 'Docker', type: 'PREFERRED' },
        ],
        totalApplications: 0, eligibleApplications: 0, rejectedApplications: 0, shortlistedApplications: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: job2Id, organizationId: orgId, publishedByUserId: hiringUserId,
        title: 'React Frontend Developer', description: 'Join our frontend team to build beautiful, responsive user interfaces using React.js.\n\nRequirements:\n- Strong proficiency in React.js and JavaScript/TypeScript\n- Experience with CSS frameworks and responsive design\n- Knowledge of state management (Redux, Context API)\n- Familiarity with REST APIs and Git',
        requiredSkills: ['React', 'JavaScript', 'CSS', 'TypeScript'],
        requiredExperience: '1+ years', requiredQualification: 'Any CS Degree',
        location: 'Remote', workMode: 'REMOTE', salary: '₹5-10 LPA',
        employmentType: 'FULL_TIME', numberOfOpenings: 2, published: true, active: true,
        applicationDeadline: '2026-12-31',
        screeningCriteria: [
          { category: 'Programming Language', requirement: 'React', type: 'MANDATORY' },
          { category: 'Technical Skill', requirement: 'JavaScript', type: 'MANDATORY' },
        ],
        totalApplications: 0, eligibleApplications: 0, rejectedApplications: 0, shortlistedApplications: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    applications: [],
    screeningResults: [],
    screeningQuestions: [
      { id: genId(), jobId: job1Id, question: 'Explain your experience with Java and Spring Boot. What kind of projects have you built?' },
      { id: genId(), jobId: job1Id, question: 'How do you approach designing a scalable microservices architecture?' },
      { id: genId(), jobId: job2Id, question: 'Describe a challenging UI component you built using React.' },
    ],
    screeningAnswers: [],
    notifications: [],
  };
}

// ===== Mock API Handlers =====
const mockHandlers = {
  // AUTH
  'POST /auth/register/hiring-team': async (data) => {
    const store = getStore();
    if (store.users.find(u => u.email === data.email)) return error('Email already registered');

    const userId = genId();
    const orgId = genId();

    store.users.push({
      id: userId, email: data.email, password: data.password,
      fullName: data.fullName, role: 'HIRING_TEAM', organizationId: orgId,
      createdAt: new Date().toISOString(),
    });
    store.organizations.push({
      id: orgId, companyName: data.companyName, industry: data.industry,
      companySize: data.companySize, companyWebsite: data.companyWebsite,
      companyLocation: data.companyLocation, companyDescription: data.companyDescription,
    });
    store.hiringTeamProfiles.push({
      id: genId(), userId, fullName: data.fullName,
      designation: data.designation, department: data.department,
      yearsOfExperience: data.yearsOfExperience || 0, bio: data.bio,
    });
    saveStore(store);

    return delay(success('Registration successful', {
      token: 'demo_jwt_' + userId,
      id: userId, email: data.email, fullName: data.fullName,
      role: 'HIRING_TEAM', organizationId: orgId,
    }));
  },

  'POST /auth/register/applicant': async (data) => {
    const store = getStore();
    if (store.users.find(u => u.email === data.email)) return error('Email already registered');

    // Backend validation (mirrors Spring Boot @Valid)
    if (!data.email || !data.email.endsWith('@gmail.com')) return error('Only Gmail addresses are accepted');
    if (!data.phone || !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) return error('Phone number must be exactly 10 digits');
    if (data.yearsOfExperience < 0 || data.yearsOfExperience > 80) return error('Experience must be between 0 and 80 years');
    if (data.githubUrl && !/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(data.githubUrl)) return error('Invalid GitHub URL');
    if (data.linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(data.linkedinUrl)) return error('Invalid LinkedIn URL');
    if (!data.skills || data.skills.length === 0) return error('At least one skill is required');

    const userId = genId();
    store.users.push({
      id: userId, email: data.email, password: data.password,
      fullName: data.fullName, role: 'APPLICANT',
      createdAt: new Date().toISOString(),
    });
    store.applicantProfiles.push({
      id: genId(), userId, fullName: data.fullName,
      professionalTitle: data.professionalTitle, phone: data.phone,
      location: data.location, education: data.education,
      skills: Array.isArray(data.skills) ? data.skills : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean),
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      professionalSummary: data.professionalSummary,
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      portfolioUrl: data.portfolioUrl, githubUrl: data.githubUrl, linkedinUrl: data.linkedinUrl,
    });
    saveStore(store);

    return delay(success('Registration successful', {
      token: 'demo_jwt_' + userId,
      id: userId, email: data.email, fullName: data.fullName, role: 'APPLICANT',
    }));
  },

  'POST /auth/login': async (data) => {
    const store = getStore();
    const user = store.users.find(u => u.email === data.email && u.password === data.password);
    if (!user) return error('Invalid email or password');
    return delay(success('Login successful', {
      token: 'demo_jwt_' + user.id,
      id: user.id, email: user.email, fullName: user.fullName,
      role: user.role, organizationId: user.organizationId,
    }));
  },

  // PROFILE
  'GET /profile/me': async () => {
    const store = getStore();
    const user = getCurrentUser(store);
    if (!user) return error('Not authenticated');

    const result = { user };
    if (user.role === 'HIRING_TEAM') {
      result.profile = store.hiringTeamProfiles.find(p => p.userId === user.id) || null;
      result.organization = store.organizations.find(o => o.id === user.organizationId) || null;
    } else {
      result.profile = store.applicantProfiles.find(p => p.userId === user.id) || null;
    }
    return delay(success('Profile retrieved', result));
  },

  'PUT /profile/applicant': async (data) => {
    const store = getStore();
    const user = getCurrentUser(store);
    const profile = store.applicantProfiles.find(p => p.userId === user.id);
    if (profile) Object.assign(profile, data);
    saveStore(store);
    return delay(success('Profile updated', profile));
  },

  'PUT /profile/hiring-team': async (data) => {
    const store = getStore();
    const user = getCurrentUser(store);
    const profile = store.hiringTeamProfiles.find(p => p.userId === user.id);
    if (profile) Object.assign(profile, data);
    saveStore(store);
    return delay(success('Profile updated', profile));
  },

  'PUT /profile/organization': async (data) => {
    const store = getStore();
    const user = getCurrentUser(store);
    const org = store.organizations.find(o => o.id === user.organizationId);
    if (org) Object.assign(org, data);
    saveStore(store);
    return delay(success('Organization updated', org));
  },

  // JOBS
  'GET /jobs/marketplace': async () => {
    const store = getStore();
    const jobs = store.jobs.filter(j => j.published && j.active);
    return delay(success('Jobs retrieved', jobs));
  },

  'GET /jobs/my-jobs': async () => {
    const store = getStore();
    const user = getCurrentUser(store);
    const jobs = store.jobs.filter(j => j.organizationId === user.organizationId);
    return delay(success('Jobs retrieved', jobs));
  },

  'POST /jobs': async (data) => {
    const store = getStore();
    const user = getCurrentUser(store);
    const job = {
      id: genId(), organizationId: user.organizationId, publishedByUserId: user.id,
      ...data,
      requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
      published: true, active: true,
      totalApplications: 0, eligibleApplications: 0, rejectedApplications: 0, shortlistedApplications: 0,
      createdAt: new Date().toISOString(),
    };

    // Create screening questions
    if (data.screeningQuestions) {
      data.screeningQuestions.forEach(q => {
        if (q.trim()) store.screeningQuestions.push({ id: genId(), jobId: job.id, question: q });
      });
    }

    store.jobs.push(job);
    saveStore(store);
    return delay(success('Job created', job));
  },

  // APPLICATIONS
  'POST /applications': async (_, formData) => {
    const store = getStore();
    const user = getCurrentUser(store);
    const jobId = formData?.get?.('jobId') || formData?.jobId;

    if (store.applications.find(a => a.jobId === jobId && a.applicantUserId === user.id)) {
      return error('You have already applied for this job');
    }

    const job = store.jobs.find(j => j.id === jobId);
    if (!job) return error('Job not found');

    const profile = store.applicantProfiles.find(p => p.userId === user.id);
    if (!profile) return error('Complete your profile first');

    const application = {
      id: genId(), jobId, applicantUserId: user.id, applicantProfileId: profile.fullName || profile.id,
      organizationId: job.organizationId, status: 'APPLIED',
      resumeUrl: profile.resumeUrl, resumeFileName: profile.resumeFileName,
      statusHistory: [{ toStatus: 'APPLIED', reason: 'Application submitted', changedAt: new Date().toISOString() }],
      internalNotes: [],
      createdAt: new Date().toISOString(),
    };

    // ===== SCREENING ANSWER ANALYSIS =====
    let screeningAnswersRaw = formData?.get?.('screeningAnswers') || formData?.screeningAnswers;
    let answersList = [];
    let aiAnswerDetected = false;
    let aiDetectionDetails = [];

    if (screeningAnswersRaw) {
      try {
        answersList = typeof screeningAnswersRaw === 'string' ? JSON.parse(screeningAnswersRaw) : screeningAnswersRaw;
      } catch (e) { answersList = []; }
    }

    // Analyze each screening answer for AI-generated content
    if (answersList.length > 0) {
      answersList.forEach(ans => {
        const aiAnalysis = analyzeContentAuthenticity(ans.answer || '');
        
        // Check answer relevance to question
        const questionWords = new Set(
          (ans.question || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const answerWords = (ans.answer || '').toLowerCase().split(/\s+/);
        const matchedWords = answerWords.filter(w => questionWords.has(w));
        const relevanceScore = questionWords.size > 0 
          ? Math.min(100, (matchedWords.length * 100 / questionWords.size) + (answerWords.length >= 20 ? 20 : 0))
          : 60;

        let evaluationStatus = 'RELEVANT';
        if (relevanceScore < 30) evaluationStatus = 'IRRELEVANT';
        else if (relevanceScore < 60) evaluationStatus = 'NEEDS_REVIEW';

        let evaluationExplanation = '';
        if (aiAnalysis.riskLevel === 'HIGH') {
          evaluationExplanation = `⚠️ HIGH AI-generated content detected (confidence: ${Math.round(aiAnalysis.confidence * 100)}%). This answer contains patterns commonly found in AI-generated text including overuse of buzzwords, uniform sentence structure, and excessive formality.`;
          aiAnswerDetected = true;
          aiDetectionDetails.push(`Q: "${ans.question}" — AI content detected (${Math.round(aiAnalysis.confidence * 100)}% confidence)`);
        } else if (aiAnalysis.riskLevel === 'MEDIUM') {
          evaluationExplanation = `⚠️ MODERATE AI indicators found (confidence: ${Math.round(aiAnalysis.confidence * 100)}%). Some patterns suggest possible AI assistance. Manual review recommended.`;
        } else {
          evaluationExplanation = 'Answer appears authentic and original based on content analysis.';
        }

        const screeningAnswer = {
          id: genId(),
          applicationId: application.id,
          questionId: ans.questionId,
          question: ans.question,
          answer: ans.answer,
          aiContentRisk: aiAnalysis.riskLevel,
          aiConfidence: aiAnalysis.confidence,
          relevanceScore,
          evaluationStatus: aiAnalysis.riskLevel === 'HIGH' ? 'AI_DETECTED' : evaluationStatus,
          evaluationExplanation,
          analyzedAt: new Date().toISOString(),
        };

        store.screeningAnswers.push(screeningAnswer);
      });
    }

    // Run AI screening on profile/resume
    const result = screenApplication(application, job, profile);
    application.screeningResultId = result.id;
    application.matchScore = result.matchScore;
    application.resumeContentRisk = result.resumeContentRisk;
    application.resumeAiConfidence = result.resumeAiConfidence;

    // ===== OVERRIDE STATUS IF AI ANSWERS DETECTED =====
    if (aiAnswerDetected) {
      application.status = 'REJECTED';
      application.rejectionReason = `🛡️ APPLICATION REJECTED — AI-Generated Content Detected in Screening Answers.\n\n` +
        `Our AI screening system has detected that one or more of your screening answers contain AI-generated content. ` +
        `This violates our application integrity policy.\n\n` +
        `Detection Details:\n` +
        aiDetectionDetails.map(d => `• ${d}`).join('\n') +
        `\n\nAll applications must contain original, authentic responses. ` +
        `If you believe this is an error, please contact the hiring team.`;
      application.eligibilityExplanation = null;
    } else if (result.recommendedStatus === 'REJECTED') {
      application.status = 'REJECTED';
      application.rejectionReason = result.overallExplanation;
    } else {
      application.status = result.recommendedStatus;
      application.eligibilityExplanation = result.overallExplanation;
    }

    application.statusHistory.push({
      fromStatus: 'APPLIED', toStatus: 'SCREENING', reason: 'Automated AI screening initiated', changedAt: new Date().toISOString(),
    });
    
    if (aiAnswerDetected) {
      application.statusHistory.push({
        fromStatus: 'SCREENING', toStatus: 'REJECTED',
        reason: '🛡️ AI-generated content detected in screening answers. Application automatically rejected.',
        changedAt: new Date().toISOString(),
      });
    } else {
      application.statusHistory.push({
        fromStatus: 'SCREENING', toStatus: application.status, reason: result.overallExplanation, changedAt: new Date().toISOString(),
      });
    }

    // Update job stats
    job.totalApplications = (job.totalApplications || 0) + 1;
    if (application.status === 'ELIGIBLE') job.eligibleApplications = (job.eligibleApplications || 0) + 1;
    if (application.status === 'REJECTED') job.rejectedApplications = (job.rejectedApplications || 0) + 1;

    store.applications.push(application);
    store.screeningResults.push(result);
    saveStore(store);
    return delay(success('Application submitted', application));
  },

  'GET /applications/my-applications': async () => {
    const store = getStore();
    const user = getCurrentUser(store);
    const apps = store.applications.filter(a => a.applicantUserId === user.id);
    return delay(success('Applications retrieved', apps));
  },

  'GET /applications/:id/screening-result': async (_, __, params) => {
    const store = getStore();
    const result = store.screeningResults.find(r => r.applicationId === params.id);
    return delay(success('Result retrieved', result));
  },

  'GET /applications/:id/screening-answers': async (_, __, params) => {
    const store = getStore();
    const answers = store.screeningAnswers.filter(a => a.applicationId === params.id);
    return delay(success('Answers retrieved', answers));
  },

  // DASHBOARD
  'GET /dashboard/hiring-team': async () => {
    const store = getStore();
    const user = getCurrentUser(store);
    const orgId = user.organizationId;
    const orgApps = store.applications.filter(a => a.organizationId === orgId);
    const org = store.organizations.find(o => o.id === orgId);

    const enrichedApps = orgApps.map(a => {
      const profile = store.applicantProfiles.find(p => p.userId === a.applicantUserId);
      return { ...a, applicantName: profile?.fullName || 'Unknown' };
    });

    return delay(success('Dashboard', {
      companyName: org?.companyName,
      totalJobs: store.jobs.filter(j => j.organizationId === orgId).length,
      activeJobs: store.jobs.filter(j => j.organizationId === orgId && j.active).length,
      totalApplications: orgApps.length,
      eligibleApplications: orgApps.filter(a => a.status === 'ELIGIBLE').length,
      rejectedApplications: orgApps.filter(a => a.status === 'REJECTED').length,
      shortlistedApplications: orgApps.filter(a => a.status === 'SHORTLISTED').length,
      interviewApplications: orgApps.filter(a => a.status === 'INTERVIEW').length,
      needsReviewApplications: orgApps.filter(a => a.status === 'NEEDS_REVIEW').length,
      selectedApplications: orgApps.filter(a => a.status === 'SELECTED').length,
      recentApplications: enrichedApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
      activeJobsList: store.jobs.filter(j => j.organizationId === orgId && j.active),
    }));
  },

  'GET /dashboard/applicant': async () => {
    const store = getStore();
    const user = getCurrentUser(store);
    const apps = store.applications.filter(a => a.applicantUserId === user.id);

    return delay(success('Dashboard', {
      totalApplications: apps.length,
      appliedCount: apps.filter(a => a.status === 'APPLIED').length,
      screeningCount: apps.filter(a => a.status === 'SCREENING').length,
      eligibleCount: apps.filter(a => a.status === 'ELIGIBLE').length,
      rejectedCount: apps.filter(a => a.status === 'REJECTED').length,
      shortlistedCount: apps.filter(a => a.status === 'SHORTLISTED').length,
      interviewCount: apps.filter(a => a.status === 'INTERVIEW').length,
      selectedCount: apps.filter(a => a.status === 'SELECTED').length,
      needsReviewCount: apps.filter(a => a.status === 'NEEDS_REVIEW').length,
      recentApplications: apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    }));
  },
};

// ===== Helper =====
function getCurrentUser(store) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const userData = JSON.parse(userStr);
  return store.users.find(u => u.id === userData.id) || userData;
}

// ===== Route Matcher & Interceptor =====
function matchRoute(method, url) {
  const path = url.replace(/^.*\/api/, '');

  for (const [key, handler] of Object.entries(mockHandlers)) {
    const [m, pattern] = key.split(' ');
    if (m !== method) continue;

    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false; break;
      }
    }
    if (match) return { handler, params };
  }
  return null;
}

// ===== Install Mock Interceptor on Axios =====
export function installDemoMode(axiosInstance) {
  console.log('%c🛡️ HireShield Demo Mode Active', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
  console.log('%cAll API calls are handled client-side with localStorage.', 'color: #94a3b8;');

  // Seed initial data if needed
  getStore();

  axiosInstance.interceptors.request.use(async (config) => {
    const method = config.method.toUpperCase();
    const url = config.url;

    // Handle dynamic GET routes
    const routeMatch = matchRoute(method, url);

    if (routeMatch) {
      const data = config.data;
      const result = await routeMatch.handler(data, config.data, routeMatch.params);
      // Cancel the actual request and return mock data
      const source = new AbortController();
      source.abort();
      config.signal = source.signal;
      config._mockResult = result;
      return config;
    }

    // Handle generic routes with dynamic IDs
    const path = url.replace(/^.*\/api/, '');

    // GET /jobs/public/:id
    if (method === 'GET' && /^\/jobs\/public\//.test(path)) {
      const jobId = path.split('/').pop();
      const store = getStore();
      const job = store.jobs.find(j => j.id === jobId);
      config._mockResult = await delay(success('Job retrieved', job));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // GET /jobs/:id
    if (method === 'GET' && /^\/jobs\/[^/]+$/.test(path) && !path.includes('marketplace') && !path.includes('my-jobs') && !path.includes('public')) {
      const jobId = path.split('/').pop();
      const store = getStore();
      const job = store.jobs.find(j => j.id === jobId);
      config._mockResult = await delay(success('Job retrieved', job));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // GET /jobs/:id/screening-questions
    if (method === 'GET' && /\/screening-questions$/.test(path)) {
      const jobId = path.split('/')[2];
      const store = getStore();
      const questions = store.screeningQuestions.filter(q => q.jobId === jobId);
      config._mockResult = await delay(success('Questions retrieved', questions));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // GET /applications/:id
    if (method === 'GET' && /^\/applications\/[^/]+$/.test(path) && !path.includes('my-applications')) {
      const appId = path.split('/').pop();
      const store = getStore();
      const app = store.applications.find(a => a.id === appId);
      config._mockResult = await delay(success('Application retrieved', app));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // GET /applications/job/:jobId
    if (method === 'GET' && /^\/applications\/job\//.test(path)) {
      const jobId = path.split('/')[3];
      const store = getStore();
      let apps = store.applications.filter(a => a.jobId === jobId);
      // Enrich with applicant names
      apps = apps.map(a => {
        const profile = store.applicantProfiles.find(p => p.userId === a.applicantUserId);
        return { ...a, applicantName: profile?.fullName || 'Unknown', applicantProfileId: profile?.fullName || a.applicantProfileId };
      });
      config._mockResult = await delay(success('Applications retrieved', apps));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // PATCH /applications/:id/status
    if (method === 'PATCH' && /\/status$/.test(path)) {
      const appId = path.split('/')[2];
      const store = getStore();
      const app = store.applications.find(a => a.id === appId);
      if (app) {
        const prevStatus = app.status;
        app.status = config.data.status;
        if (config.data.reason) {
          if (config.data.status === 'REJECTED') app.rejectionReason = config.data.reason;
          else app.eligibilityExplanation = config.data.reason;
        }
        app.statusHistory.push({
          fromStatus: prevStatus, toStatus: config.data.status,
          reason: config.data.reason || '', changedAt: new Date().toISOString(),
        });
        // Update job stats
        const job = store.jobs.find(j => j.id === app.jobId);
        if (job && config.data.status === 'SHORTLISTED') job.shortlistedApplications = (job.shortlistedApplications || 0) + 1;
        saveStore(store);
      }
      config._mockResult = await delay(success('Status updated', app));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // POST /applications/:id/notes
    if (method === 'POST' && /\/notes$/.test(path)) {
      const appId = path.split('/')[2];
      const store = getStore();
      const app = store.applications.find(a => a.id === appId);
      if (app) {
        const user = getCurrentUser(store);
        app.internalNotes.push({
          note: config.data.note, addedByUserId: user?.id,
          addedByName: user?.fullName || 'Recruiter', addedAt: new Date().toISOString(),
        });
        saveStore(store);
      }
      config._mockResult = await delay(success('Note added', app));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    // File uploads - just return success
    if (method === 'POST' && (path.includes('upload-photo') || path.includes('upload-resume') || path.includes('upload-logo'))) {
      config._mockResult = await delay(success('Upload successful', { url: 'https://via.placeholder.com/200', public_id: genId() }));
      const ctrl = new AbortController(); ctrl.abort(); config.signal = ctrl.signal;
      return config;
    }

    return config;
  });

  // Intercept errors from aborted requests and return mock data
  axiosInstance.interceptors.response.use(
    (response) => response,
    (err) => {
      if (err?.config?._mockResult) {
        return Promise.resolve(err.config._mockResult);
      }
      // If it's a network error (backend not running), try to handle it
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('⚠️ Backend not available, request not mocked:', err.config?.method, err.config?.url);
      }
      return Promise.reject(err);
    }
  );
}

export function resetDemoData() {
  localStorage.removeItem('hireshield_demo');
  getStore(); // Re-create initial data
  console.log('🔄 Demo data reset');
}

export function isDemoMode() {
  return true; // Always demo mode for hackathon
}
