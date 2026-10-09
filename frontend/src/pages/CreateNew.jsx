import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobAPI } from '../services/api';

const ENTITY_OPTIONS = [
  {
    id: 'applicant',
    icon: '👤',
    title: 'Applicant',
    description: 'Create and register a new applicant profile',
    action: 'register-applicant',
  },
  {
    id: 'hiring',
    icon: '👔',
    title: 'Hiring Team Member',
    description: 'Create a recruiter or hiring manager profile',
    action: 'register-hiring',
  },
  {
    id: 'job',
    icon: '💼',
    title: 'Job Vacancy',
    description: 'Create and publish a new job posting',
    action: 'create-job',
  },
  {
    id: 'question',
    icon: '❓',
    title: 'Screening Question',
    description: 'Add a screening question to an existing job',
    action: 'create-question',
  },
];

export default function CreateNew() {
  const navigate = useNavigate();
  const { isHiringTeam } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Screening Question state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('TEXT');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelect = async (option) => {
    if (option.action === 'register-applicant') {
      navigate('/register?role=applicant');
      return;
    }
    if (option.action === 'register-hiring') {
      navigate('/register?role=hiring');
      return;
    }
    if (option.action === 'create-job') {
      navigate('/hiring/create-job');
      return;
    }
    if (option.action === 'create-question') {
      setSelectedEntity('question');
      setLoadingJobs(true);
      try {
        const res = await jobAPI.getMyJobs();
        setJobs(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingJobs(false);
      }
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedJobId || !questionText.trim()) return;
    setSaving(true);
    try {
      await jobAPI.addScreeningQuestion(selectedJobId, {
        question: questionText,
        type: questionType,
        required: questionRequired,
      });
      setSuccessMsg('Screening question added successfully!');
      setQuestionText('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  // Screening Question Form
  if (selectedEntity === 'question') {
    return (
      <div className="main-content" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEntity(null)} style={{ marginBottom: '0.5rem' }}>
            ← Back to Create New
          </button>
          <h1>Add Screening Question</h1>
          <p>Add a screening question to an existing job posting</p>
        </div>

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, marginBottom: '1rem', color: 'var(--success-500)', fontWeight: 600 }}>
            ✅ {successMsg}
          </div>
        )}

        <div className="card">
          {/* Step 1: Select Job */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              1. Select Job <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            {loadingJobs ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading jobs...</p>
            ) : jobs.length > 0 ? (
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="">— Select a job —</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No jobs found. Create a job first.</p>
            )}
          </div>

          {/* Step 2: Question */}
          {selectedJobId && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  2. Question <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="e.g., Explain your experience with Spring Boot..."
                  className="input"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Question Type</label>
                  <select value={questionType} onChange={e => setQuestionType(e.target.value)} className="input" style={{ width: '100%' }}>
                    <option value="TEXT">Text Answer</option>
                    <option value="YES_NO">Yes / No</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Required?</label>
                  <select value={questionRequired ? 'yes' : 'no'} onChange={e => setQuestionRequired(e.target.value === 'yes')} className="input" style={{ width: '100%' }}>
                    <option value="yes">Required</option>
                    <option value="no">Optional</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveQuestion}
                disabled={!questionText.trim() || saving}
                style={{ width: '100%' }}
              >
                {saving ? 'Saving...' : '+ Add Screening Question'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Entity Selector (Main View)
  return (
    <div className="main-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>Create New</h1>
        <p>What would you like to create?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
        {ENTITY_OPTIONS.map(option => (
          <div
            key={option.id}
            className="card"
            onClick={() => handleSelect(option)}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem 1.5rem',
              transition: 'all 0.25s ease',
              border: '2px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-500)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{option.icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{option.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
