import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../../services/api';

export default function CreateJob() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', requiredSkills: '', requiredExperience: '',
    requiredQualification: '', location: '', workMode: 'ONSITE', salary: '',
    employmentType: 'FULL_TIME', numberOfOpenings: 1, applicationDeadline: '',
    screeningCriteria: [{ category: '', requirement: '', type: 'MANDATORY', description: '' }],
    screeningQuestions: [''],
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addCriterion = () => setForm(prev => ({ ...prev, screeningCriteria: [...prev.screeningCriteria, { category: '', requirement: '', type: 'MANDATORY', description: '' }] }));
  const removeCriterion = (i) => setForm(prev => ({ ...prev, screeningCriteria: prev.screeningCriteria.filter((_, idx) => idx !== i) }));
  const updateCriterion = (i, field, value) => {
    const updated = [...form.screeningCriteria];
    updated[i] = { ...updated[i], [field]: value };
    setForm(prev => ({ ...prev, screeningCriteria: updated }));
  };

  const addQuestion = () => setForm(prev => ({ ...prev, screeningQuestions: [...prev.screeningQuestions, ''] }));
  const removeQuestion = (i) => setForm(prev => ({ ...prev, screeningQuestions: prev.screeningQuestions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i, value) => {
    const updated = [...form.screeningQuestions];
    updated[i] = value;
    setForm(prev => ({ ...prev, screeningQuestions: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        requiredSkills: typeof form.requiredSkills === 'string'
          ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : (form.requiredSkills || []),
        screeningCriteria: (form.screeningCriteria || []).filter(c => c.category && c.requirement),
        screeningQuestions: (form.screeningQuestions || []).filter(q => q && q.trim()),
        numberOfOpenings: parseInt(form.numberOfOpenings) || 1,
        applicationDeadline: form.applicationDeadline ? form.applicationDeadline : null,
      };
      await jobAPI.createJob(payload);
      navigate('/hiring/jobs');
    } catch (err) {
      console.error('Create job error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create job';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 800 }}>
      <div className="page-header"><h1>Create Job Vacancy</h1><p>Define the role, requirements, and screening criteria</p></div>

      <div className="step-indicator" style={{ marginBottom: '2rem' }}>
        {['Job Details', 'Screening Criteria', 'Screening Questions'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div onClick={() => setStep(i + 1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className={`step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''}`} />
              <span style={{ fontSize: '0.8rem', color: i + 1 === step ? 'var(--primary-400)' : 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
            </div>
            {i < 2 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {error && <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

      <div className="card">
        {/* Step 1: Job Details */}
        {step === 1 && (
          <>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Job Details</h3>
            <div className="form-group"><label className="form-label">Job Title *</label><input className="form-input" placeholder="e.g. Senior Java Developer" value={form.title} onChange={e => updateField('title', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Job Description *</label><textarea className="form-textarea" style={{ minHeight: 150 }} placeholder="Detailed job description..." value={form.description} onChange={e => updateField('description', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Required Skills (comma separated)</label><input className="form-input" placeholder="Java, Spring Boot, MongoDB, React" value={form.requiredSkills} onChange={e => updateField('requiredSkills', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Required Experience</label><input className="form-input" placeholder="e.g. 2+ years" value={form.requiredExperience} onChange={e => updateField('requiredExperience', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Required Qualification</label><input className="form-input" placeholder="e.g. B.E/B.Tech" value={form.requiredQualification} onChange={e => updateField('requiredQualification', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="e.g. Bangalore, India" value={form.location} onChange={e => updateField('location', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Work Mode</label><select className="form-select" value={form.workMode} onChange={e => updateField('workMode', e.target.value)}><option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Employment Type</label><select className="form-select" value={form.employmentType} onChange={e => updateField('employmentType', e.target.value)}><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option></select></div>
              <div className="form-group"><label className="form-label">Salary / CTC</label><input className="form-input" placeholder="e.g. ₹8-12 LPA" value={form.salary} onChange={e => updateField('salary', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Openings</label><input type="number" className="form-input" min="1" value={form.numberOfOpenings} onChange={e => updateField('numberOfOpenings', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.applicationDeadline} onChange={e => updateField('applicationDeadline', e.target.value)} /></div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setStep(2)}>Continue to Screening Criteria →</button>
          </>
        )}

        {/* Step 2: Screening Criteria */}
        {step === 2 && (
          <>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Screening Criteria</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Define mandatory and preferred requirements for automatic screening</p>
            {form.screeningCriteria.map((criterion, i) => (
              <div key={i} style={{ padding: '1rem', background: 'var(--bg-glass)', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={criterion.category} onChange={e => updateCriterion(i, 'category', e.target.value)}><option value="">Select</option><option>Programming Language</option><option>Degree</option><option>Certification</option><option>Technical Skill</option><option>Experience</option><option>Location</option><option>Work Authorization</option><option>Other</option></select></div>
                  <div className="form-group"><label className="form-label">Requirement</label><input className="form-input" placeholder="e.g. Java, B.E/B.Tech" value={criterion.requirement} onChange={e => updateCriterion(i, 'requirement', e.target.value)} /></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Type</label><select className="form-select" value={criterion.type} onChange={e => updateCriterion(i, 'type', e.target.value)}><option value="MANDATORY">🔴 Mandatory</option><option value="PREFERRED">🟡 Preferred</option></select></div>
                  {form.screeningCriteria.length > 1 && <button className="btn btn-ghost btn-sm" onClick={() => removeCriterion(i)} style={{ color: 'var(--danger-500)', marginBottom: '1.25rem' }}>Remove</button>}
                </div>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addCriterion} style={{ marginBottom: '1.5rem' }}>+ Add Criterion</button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </>
        )}

        {/* Step 3: Screening Questions */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Screening Questions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Add questions that candidates will answer during the application process</p>
            {form.screeningQuestions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, paddingTop: '0.7rem', minWidth: '1.5rem' }}>{i + 1}.</span>
                <textarea className="form-textarea" style={{ minHeight: 60, flex: 1 }} placeholder="e.g. Explain your experience with Java and Spring Boot..." value={q} onChange={e => updateQuestion(i, e.target.value)} />
                {form.screeningQuestions.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeQuestion(i)} style={{ color: 'var(--danger-500)', paddingTop: '0.7rem' }}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addQuestion} style={{ marginBottom: '1.5rem' }}>+ Add Question</button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="btn btn-accent btn-lg" style={{ flex: 1 }} disabled={loading}>{loading ? 'Publishing...' : '🚀 Publish Job'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
