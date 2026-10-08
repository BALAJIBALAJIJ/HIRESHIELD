import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobAPI, applicationAPI } from '../../services/api';

// Resume storage helper
function getResumes() {
  try { return JSON.parse(localStorage.getItem('hireshield_resumes') || '[]'); }
  catch { return []; }
}

export default function JobDetails() {
  const { jobId } = useParams();
  const { user, isAuthenticated, isApplicant } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [answers, setAnswers] = useState({});

  // Resume selection
  const [resumeMode, setResumeMode] = useState('saved'); // 'saved' | 'new'
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [newResumeFile, setNewResumeFile] = useState(null);

  useEffect(() => { loadJob(); }, [jobId]);

  const loadJob = async () => {
    try {
      const [jobRes, questionsRes] = await Promise.all([
        jobAPI.getJobById(jobId),
        jobAPI.getScreeningQuestions(jobId)
      ]);
      setJob(jobRes.data.data);
      const qs = questionsRes.data.data || [];
      setQuestions(qs);
      const initial = {};
      qs.forEach(q => { initial[q.id] = ''; });
      setAnswers(initial);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openApplyModal = () => {
    // Load saved resumes
    const userResumes = getResumes().filter(r => r.userId === user?.id);
    setSavedResumes(userResumes);
    setResumeMode(userResumes.length > 0 ? 'saved' : 'new');
    setSelectedResumeId(userResumes.length > 0 ? userResumes[0].id : null);
    setNewResumeFile(null);
    setApplyStep(1);
    setShowApply(true);
  };

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isApplicant) { alert('Only applicants can apply for jobs'); return; }

    // If there are questions and we're on step 1, go to step 2
    if (questions.length > 0 && applyStep === 1) {
      setApplyStep(2);
      return;
    }

    // Validate all questions are answered
    if (questions.length > 0) {
      const unanswered = questions.filter(q => !answers[q.id]?.trim());
      if (unanswered.length > 0) {
        alert('Please answer all screening questions before submitting.');
        return;
      }
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('jobId', jobId);

      // Attach selected resume info
      if (resumeMode === 'saved' && selectedResumeId) {
        const resume = savedResumes.find(r => r.id === selectedResumeId);
        if (resume) {
          formData.append('resumeFileName', resume.fileName);
          formData.append('resumeDataUrl', resume.dataUrl);
        }
      } else if (resumeMode === 'new' && newResumeFile) {
        formData.append('resume', newResumeFile);
      }

      // Include screening answers
      if (questions.length > 0) {
        const answersList = questions.map(q => ({
          questionId: q.id,
          question: q.question,
          answer: answers[q.id] || ''
        }));
        formData.append('screeningAnswers', JSON.stringify(answersList));
      }

      await applicationAPI.apply(formData);
      setApplied(true);
      setShowApply(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;
  if (!job) return <div className="main-content"><div className="empty-state"><h3>Job not found</h3></div></div>;

  return (
    <div className="main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Job Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div className="job-card-logo" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>{job.title?.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)' }}>{job.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              📍 {job.location || 'Remote'} • 💼 {job.workMode?.replace('_', ' ')} • ⏱ {job.requiredExperience || 'Any experience'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-info">{job.employmentType?.replace('_', ' ')}</span>
              {job.salary && <span className="badge badge-success">{job.salary}</span>}
              <span className="badge badge-applied">{job.numberOfOpenings} Opening{job.numberOfOpenings > 1 ? 's' : ''}</span>
              {job.applicationDeadline && <span className="badge badge-warning">Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>}
            </div>
          </div>
          {!applied ? (
            <button className="btn btn-primary btn-lg" onClick={openApplyModal}>Apply Now</button>
          ) : (
            <span className="badge badge-success" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>✅ Applied</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Left Column */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title">Job Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{job.description}</p>
          </div>

          {job.requiredSkills?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 className="card-title">Required Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {job.requiredSkills.map((s, i) => <span key={i} className="badge badge-info">{s}</span>)}
              </div>
            </div>
          )}

          {job.screeningCriteria?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 className="card-title">Screening Criteria</h3>
              <div style={{ marginTop: '0.75rem' }}>
                {job.screeningCriteria.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < job.screeningCriteria.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span className={`badge ${c.type === 'MANDATORY' ? 'badge-danger' : 'badge-warning'}`}>{c.type}</span>
                    <span style={{ fontWeight: 600 }}>{c.category}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{c.requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="card">
              <h3 className="card-title">Screening Questions</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
                You'll be asked to answer these questions during the application process.
              </p>
              {questions.map((q, i) => (
                <div key={q.id} style={{ padding: '0.6rem 0', borderBottom: i < questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.5rem' }}>{i + 1}.</span>
                  <span style={{ color: 'var(--text-primary)' }}>{q.question}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Job Summary</h3>
            <div style={{ marginTop: '1rem' }}>
              {[
                ['Qualification', job.requiredQualification],
                ['Experience', job.requiredExperience],
                ['Location', job.location],
                ['Work Mode', job.workMode?.replace('_', ' ')],
                ['Type', job.employmentType?.replace('_', ' ')],
                ['Salary', job.salary || 'Not disclosed'],
                ['Openings', job.numberOfOpenings],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          {!applied && (
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={openApplyModal}>Apply Now →</button>
          )}
        </div>
      </div>

      {/* ===== APPLY MODAL ===== */}
      {showApply && (
        <div className="modal-overlay" onClick={() => setShowApply(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Apply for {job.title}</h3>
              <button className="modal-close" onClick={() => setShowApply(false)}>✕</button>
            </div>

            {/* Step Indicator */}
            {questions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: applyStep === 1 ? 32 : 10, height: 10, borderRadius: 99, background: applyStep === 1 ? 'var(--primary-500)' : 'var(--success-500)', transition: 'all 0.3s' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: applyStep === 1 ? 'var(--primary-400)' : 'var(--success-500)' }}>Resume</span>
                </div>
                <div style={{ width: 40, height: 2, background: 'var(--border-color)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: applyStep === 2 ? 32 : 10, height: 10, borderRadius: 99, background: applyStep === 2 ? 'var(--primary-500)' : 'var(--border-color)', transition: 'all 0.3s' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: applyStep === 2 ? 'var(--primary-400)' : 'var(--text-muted)' }}>Screening</span>
                </div>
              </div>
            )}

            {/* ===== STEP 1: RESUME SELECTION ===== */}
            {applyStep === 1 && (
              <>
                {/* Resume Source Toggle */}
                {savedResumes.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '0.3rem', border: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => setResumeMode('saved')}
                      style={{
                        flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                        background: resumeMode === 'saved' ? 'var(--primary-500)' : 'transparent',
                        color: resumeMode === 'saved' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                      }}
                    >
                      📁 My Saved Resumes ({savedResumes.length})
                    </button>
                    <button
                      onClick={() => setResumeMode('new')}
                      style={{
                        flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                        background: resumeMode === 'new' ? 'var(--primary-500)' : 'transparent',
                        color: resumeMode === 'new' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                      }}
                    >
                      📤 Upload New Resume
                    </button>
                  </div>
                )}

                {/* Saved Resumes List */}
                {resumeMode === 'saved' && savedResumes.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem' }}>Select a resume to use:</label>
                    {savedResumes.map(resume => (
                      <label key={resume.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem',
                        background: selectedResumeId === resume.id ? 'rgba(59,130,246,0.1)' : 'var(--bg-glass)',
                        border: selectedResumeId === resume.id ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}>
                        <input
                          type="radio" name="resume"
                          checked={selectedResumeId === resume.id}
                          onChange={() => setSelectedResumeId(resume.id)}
                          style={{ accentColor: 'var(--primary-500)', width: 18, height: 18 }}
                        />
                        <div style={{
                          width: 40, height: 40, borderRadius: '8px',
                          background: resume.fileName.endsWith('.pdf') ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                        }}>
                          {resume.fileName.endsWith('.pdf') ? '📕' : '📘'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{resume.fileName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatFileSize(resume.fileSize)} • Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {selectedResumeId === resume.id && <span style={{ color: 'var(--primary-500)', fontSize: '1.2rem' }}>✓</span>}
                      </label>
                    ))}
                  </div>
                )}

                {/* Upload New Resume */}
                {(resumeMode === 'new' || savedResumes.length === 0) && (
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Upload Resume (PDF, DOC, DOCX)</label>
                    <div style={{
                      border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                      padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                      background: newResumeFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                      borderColor: newResumeFile ? 'var(--success-500)' : 'var(--border-color)',
                      transition: 'all 0.2s',
                    }}>
                      {newResumeFile ? (
                        <div>
                          <span style={{ fontSize: '2rem' }}>{newResumeFile.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                          <p style={{ fontWeight: 600, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{newResumeFile.name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{formatFileSize(newResumeFile.size)}</p>
                          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem', color: 'var(--danger-500)' }}
                            onClick={() => setNewResumeFile(null)}>
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer' }}>
                          <span style={{ fontSize: '2rem', display: 'block' }}>📄</span>
                          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Click to upload or drag & drop</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PDF, DOC, DOCX (max 5MB)</p>
                          <input type="file" hidden accept=".pdf,.doc,.docx"
                            onChange={e => { if (e.target.files[0]) setNewResumeFile(e.target.files[0]); }} />
                        </label>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Optional — your profile resume will be used if not selected.
                    </p>
                  </div>
                )}

                {/* Info Box */}
                <div style={{ background: 'rgba(59,130,246,0.08)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--primary-400)' }}>ℹ️ What happens next:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                    <li>Your resume will be analyzed against job requirements</li>
                    <li>Mandatory criteria will be validated automatically</li>
                    <li>Your screening answers will be checked for authenticity</li>
                    <li>⚠️ <strong>AI-generated answers will be detected and flagged</strong></li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(239,68,68,0.08)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <strong style={{ color: 'var(--danger-500)' }}>🛡️ AI Content Detection Active</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Our system detects AI-generated content. Write <strong>original, authentic responses</strong>. 
                    Applications with AI-generated content may be <strong>rejected automatically</strong>.
                  </p>
                </div>

                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleApply}>
                  {questions.length > 0 ? 'Continue to Screening Questions →' : (applying ? '🔄 Submitting...' : '🚀 Submit Application')}
                </button>
              </>
            )}

            {/* ===== STEP 2: SCREENING QUESTIONS ===== */}
            {applyStep === 2 && (
              <>
                <div style={{ background: 'rgba(245,158,11,0.08)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <strong style={{ color: 'var(--warning-500)' }}>📝 Answer All Questions Below</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Write your own answers based on your real experience. AI-generated or copied answers will be <strong>automatically detected and may result in rejection</strong>.
                  </p>
                </div>

                {questions.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ display: 'flex', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--primary-400)' }}>Q{i + 1}.</span>
                      {q.question}
                    </label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 100, marginTop: '0.5rem' }}
                      placeholder="Write your answer here... (Be specific about your real experience)"
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: (answers[q.id]?.trim().split(/\s+/).filter(Boolean).length || 0) < 10 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                        {answers[q.id]?.trim().split(/\s+/).filter(Boolean).length || 0} words
                        {(answers[q.id]?.trim().split(/\s+/).filter(Boolean).length || 0) < 10 && ' (minimum 10 words recommended)'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🛡️ AI detection active</span>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setApplyStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleApply} disabled={applying}>
                    {applying ? '🔄 Analyzing & Submitting...' : '🚀 Submit Application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
