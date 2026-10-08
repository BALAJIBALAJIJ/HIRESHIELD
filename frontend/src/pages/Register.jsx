import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  validateApplicantStep1, validateApplicantStep2,
  validateFullName, validateEmail, validatePassword, validateConfirmPassword,
  validateProfessionalTitle, validatePhone, validateLocation, validateEducation,
  validateExperience, validateLinkedIn, validateGitHub, validateSkills,
  LOCATIONS, SKILLS_LIST, ALL_SKILLS,
} from '../utils/validators';

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'applicant';
  const isHiring = role === 'hiring';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Applicant form data
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    professionalTitle: '', phone: '', location: '', education: '',
    yearsOfExperience: '', skills: [], professionalSummary: '',
    linkedinUrl: '', githubUrl: '', portfolioUrl: '',
  });

  // Hiring team form data
  const [hiringForm, setHiringForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    designation: '', department: '', yearsOfExperience: '', bio: '',
    companyName: '', industry: 'Technology', companySize: '1-10',
    companyWebsite: '', companyLocation: '', companyDescription: '',
  });

  // Skills UI state
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [otherSkill, setOtherSkill] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  const totalSteps = isHiring ? 3 : 2;

  // ===== Field Change Handler =====
  const updateForm = (field, value) => {
    if (isHiring) {
      setHiringForm(p => ({ ...p, [field]: value }));
    } else {
      setForm(p => ({ ...p, [field]: value }));
    }
    // Clear error on change
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    setError('');
  };

  const markTouched = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    // Validate on blur
    const data = isHiring ? hiringForm : form;
    let err = '';
    switch (field) {
      case 'fullName': err = validateFullName(data.fullName); break;
      case 'email': err = validateEmail(data.email); break;
      case 'password': err = validatePassword(data.password); break;
      case 'confirmPassword': err = validateConfirmPassword(data.password, data.confirmPassword); break;
      case 'professionalTitle': err = validateProfessionalTitle(data.professionalTitle); break;
      case 'phone': err = validatePhone(data.phone); break;
      case 'location': err = validateLocation(data.location); break;
      case 'education': err = validateEducation(data.education); break;
      case 'yearsOfExperience': err = validateExperience(data.yearsOfExperience); break;
      case 'linkedinUrl': err = validateLinkedIn(data.linkedinUrl); break;
      case 'githubUrl': err = validateGitHub(data.githubUrl); break;
      case 'skills': err = validateSkills(data.skills); break;
    }
    if (err) setErrors(p => ({ ...p, [field]: err }));
  };

  // ===== Skills Management =====
  const addSkill = (skill) => {
    if (!form.skills.includes(skill)) {
      const newSkills = [...form.skills, skill];
      setForm(p => ({ ...p, skills: newSkills }));
      if (errors.skills) setErrors(p => ({ ...p, skills: '' }));
    }
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const removeSkill = (skill) => {
    const newSkills = form.skills.filter(s => s !== skill);
    setForm(p => ({ ...p, skills: newSkills }));
  };

  const addOtherSkill = () => {
    if (otherSkill.trim() && !form.skills.includes(otherSkill.trim())) {
      addSkill(otherSkill.trim());
      setOtherSkill('');
      setShowOtherInput(false);
    }
  };

  const filteredSkills = skillSearch.trim()
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !form.skills.includes(s))
    : [];

  // ===== Step Navigation =====
  const handleNext = () => {
    setError('');

    if (!isHiring) {
      // Applicant Step 1
      if (step === 1) {
        const stepErrors = validateApplicantStep1(form);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
          return;
        }
        setStep(2);
      }
    } else {
      // Hiring team steps
      if (step === 1) {
        const stepErrors = {};
        if (!hiringForm.fullName.trim()) stepErrors.fullName = 'Full name is required';
        if (!hiringForm.email.trim()) stepErrors.email = 'Email is required';
        if (!hiringForm.password || hiringForm.password.length < 6) stepErrors.password = 'Password must be at least 6 characters';
        if (hiringForm.password !== hiringForm.confirmPassword) stepErrors.confirmPassword = 'Passwords do not match';
        if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
        setStep(2);
      } else if (step === 2) {
        if (!hiringForm.designation?.trim()) { setErrors({ designation: 'Designation is required' }); return; }
        setStep(3);
      }
    }
  };

  // ===== Submit =====
  const handleSubmit = async () => {
    setError('');

    if (!isHiring) {
      // Validate step 2
      const stepErrors = validateApplicantStep2(form);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setTouched({ professionalTitle: true, phone: true, location: true, education: true, yearsOfExperience: true, skills: true, linkedinUrl: true, githubUrl: true });
        return;
      }
    } else {
      if (!hiringForm.companyName?.trim()) {
        setErrors({ companyName: 'Company name is required' });
        return;
      }
    }

    setLoading(true);
    try {
      const { authAPI } = await import('../services/api');
      let res;
      if (isHiring) {
        res = await authAPI.registerHiringTeam(hiringForm);
      } else {
        res = await authAPI.registerApplicant({
          ...form,
          yearsOfExperience: Number(form.yearsOfExperience) || 0,
        });
      }
      const data = res.data.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      login(data);
      navigate(isHiring ? '/hiring/dashboard' : '/applicant/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Error Display Component =====
  const FieldError = ({ field }) => {
    const err = errors[field];
    if (!err) return null;
    return <p style={{ color: 'var(--danger-500)', fontSize: '0.8rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⚠️ {err}</p>;
  };

  const fieldStyle = (field) => ({
    borderColor: errors[field] ? 'var(--danger-500)' : undefined,
    boxShadow: errors[field] ? '0 0 0 2px rgba(239,68,68,0.2)' : undefined,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
      <div className="card" style={{ maxWidth: 620, width: '100%', padding: '2rem 2.5rem' }}>

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: i + 1 === step ? 32 : 12, height: 12, borderRadius: 99,
                background: i + 1 <= step ? 'var(--primary-500)' : 'var(--border-color)',
                transition: 'all 0.3s',
              }} />
              {i < totalSteps - 1 && <div style={{ width: 30, height: 2, background: 'var(--border-color)' }} />}
            </span>
          ))}
        </div>

        {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--danger-500)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

        {/* ===== APPLICANT STEP 1: Account ===== */}
        {!isHiring && step === 1 && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Step 1 — Your login credentials</p>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" style={fieldStyle('fullName')} placeholder="e.g., Arun Kumar"
                value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} onBlur={() => markTouched('fullName')} />
              <FieldError field="fullName" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Gmail only)</span></label>
              <input className="form-input" type="email" style={fieldStyle('email')} placeholder="yourname@gmail.com"
                value={form.email} onChange={e => updateForm('email', e.target.value.toLowerCase())} onBlur={() => markTouched('email')} />
              <FieldError field="email" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" style={fieldStyle('password')} placeholder="Min 6 characters"
                  value={form.password} onChange={e => updateForm('password', e.target.value)} onBlur={() => markTouched('password')} />
                <FieldError field="password" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input className="form-input" type="password" style={fieldStyle('confirmPassword')} placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} onBlur={() => markTouched('confirmPassword')} />
                <FieldError field="confirmPassword" />
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.75rem' }} onClick={handleNext}>
              Continue →
            </button>
          </>
        )}

        {/* ===== APPLICANT STEP 2: Profile & Skills ===== */}
        {!isHiring && step === 2 && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Professional Details</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Step 2 — Your professional information</p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Professional Title *</label>
                <input className="form-input" style={fieldStyle('professionalTitle')} placeholder="e.g., Full Stack Developer"
                  value={form.professionalTitle} onChange={e => updateForm('professionalTitle', e.target.value)} onBlur={() => markTouched('professionalTitle')} />
                <FieldError field="professionalTitle" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(10 digits)</span></label>
                <input className="form-input" style={fieldStyle('phone')} placeholder="9876543210" maxLength={10}
                  value={form.phone} onChange={e => updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} onBlur={() => markTouched('phone')} />
                <FieldError field="phone" />
                {form.phone && !errors.phone && <p style={{ color: 'var(--success-500)', fontSize: '0.75rem', marginTop: '0.2rem' }}>✓ {form.phone.length}/10 digits</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location *</label>
                <select className="form-input" style={{ ...fieldStyle('location'), cursor: 'pointer' }}
                  value={form.location} onChange={e => updateForm('location', e.target.value)} onBlur={() => markTouched('location')}>
                  <option value="">— Select Location —</option>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <FieldError field="location" />
              </div>
              <div className="form-group">
                <label className="form-label">Experience * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(0–80 years)</span></label>
                <input className="form-input" type="number" min="0" max="80" style={fieldStyle('yearsOfExperience')} placeholder="e.g., 3"
                  value={form.yearsOfExperience} onChange={e => updateForm('yearsOfExperience', e.target.value)} onBlur={() => markTouched('yearsOfExperience')} />
                <FieldError field="yearsOfExperience" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Education *</label>
              <input className="form-input" style={fieldStyle('education')} placeholder="e.g., B.E. Computer Science Engineering"
                value={form.education} onChange={e => updateForm('education', e.target.value)} onBlur={() => markTouched('education')} />
              <FieldError field="education" />
            </div>

            {/* ===== SKILLS SELECTOR ===== */}
            <div className="form-group">
              <label className="form-label">Skills * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Select from list or add custom)</span></label>
              
              {/* Selected Skills */}
              {form.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {form.skills.map(skill => (
                    <span key={skill} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', paddingRight: '0.3rem' }}>
                      {skill}
                      <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem', opacity: 0.7 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div style={{ position: 'relative' }}>
                <input className="form-input" style={fieldStyle('skills')} placeholder="🔍 Search skills (e.g., Java, React, Python...)"
                  value={skillSearch}
                  onChange={e => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                  onFocus={() => setShowSkillDropdown(true)}
                />

                {/* Dropdown Results */}
                {showSkillDropdown && skillSearch.trim() && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', maxHeight: 200, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                    {filteredSkills.length > 0 ? (
                      filteredSkills.slice(0, 15).map(skill => (
                        <div key={skill} onClick={() => addSkill(skill)}
                          style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                          onMouseOver={e => e.target.style.background = 'var(--bg-glass)'}
                          onMouseOut={e => e.target.style.background = 'transparent'}>
                          {skill}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No match found. Use "Other" to add custom skill.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category Browse */}
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Browse by category:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: 120, overflowY: 'auto', padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  {Object.entries(SKILLS_LIST).map(([category, skills]) => (
                    <details key={category} style={{ width: '100%' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-400)', padding: '0.3rem 0' }}>{category}</summary>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', padding: '0.3rem 0' }}>
                        {skills.filter(s => !form.skills.includes(s)).map(skill => (
                          <button key={skill} className="badge" onClick={() => addSkill(skill)}
                            style={{ cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Other Skill */}
              <div style={{ marginTop: '0.75rem' }}>
                {!showOtherInput ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowOtherInput(true)} style={{ fontSize: '0.8rem' }}>
                    ➕ Add Other Skill (not in list)
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Type your custom skill..." value={otherSkill}
                      onChange={e => setOtherSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOtherSkill(); } }}
                      style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={addOtherSkill} disabled={!otherSkill.trim()}>Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowOtherInput(false); setOtherSkill(''); }}>Cancel</button>
                  </div>
                )}
              </div>
              <FieldError field="skills" />
            </div>

            {/* LinkedIn & GitHub */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" style={fieldStyle('linkedinUrl')} placeholder="https://www.linkedin.com/in/username"
                  value={form.linkedinUrl} onChange={e => updateForm('linkedinUrl', e.target.value)} onBlur={() => markTouched('linkedinUrl')} />
                <FieldError field="linkedinUrl" />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" style={fieldStyle('githubUrl')} placeholder="https://github.com/username"
                  value={form.githubUrl} onChange={e => updateForm('githubUrl', e.target.value)} onBlur={() => markTouched('githubUrl')} />
                <FieldError field="githubUrl" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary</label>
              <textarea className="form-textarea" placeholder="Brief summary of your experience and expertise..."
                value={form.professionalSummary} onChange={e => updateForm('professionalSummary', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? '🔄 Creating...' : '🚀 Create Account'}
              </button>
            </div>
          </>
        )}

        {/* ===== HIRING TEAM STEPS ===== */}
        {isHiring && step === 1 && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Step 1 — Login credentials</p>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" style={fieldStyle('fullName')} value={hiringForm.fullName} onChange={e => updateForm('fullName', e.target.value)} /><FieldError field="fullName" /></div>
            <div className="form-group"><label className="form-label">Work Email *</label><input className="form-input" type="email" style={fieldStyle('email')} value={hiringForm.email} onChange={e => updateForm('email', e.target.value)} /><FieldError field="email" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" style={fieldStyle('password')} value={hiringForm.password} onChange={e => updateForm('password', e.target.value)} /><FieldError field="password" /></div>
              <div className="form-group"><label className="form-label">Confirm Password *</label><input className="form-input" type="password" style={fieldStyle('confirmPassword')} value={hiringForm.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} /><FieldError field="confirmPassword" /></div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.75rem' }} onClick={handleNext}>Continue →</button>
          </>
        )}

        {isHiring && step === 2 && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Professional Profile</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Step 2 — Your role details</p>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Designation *</label><input className="form-input" style={fieldStyle('designation')} value={hiringForm.designation} onChange={e => updateForm('designation', e.target.value)} /><FieldError field="designation" /></div>
              <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={hiringForm.department} onChange={e => updateForm('department', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-input" type="number" min="0" max="80" value={hiringForm.yearsOfExperience} onChange={e => updateForm('yearsOfExperience', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" value={hiringForm.bio} onChange={e => updateForm('bio', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleNext}>Continue →</button>
            </div>
          </>
        )}

        {isHiring && step === 3 && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Organization Setup</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Step 3 — Your company information</p>
            <div className="form-group"><label className="form-label">Company Name *</label><input className="form-input" style={fieldStyle('companyName')} value={hiringForm.companyName} onChange={e => updateForm('companyName', e.target.value)} /><FieldError field="companyName" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Industry</label>
                <select className="form-input" value={hiringForm.industry} onChange={e => updateForm('industry', e.target.value)}>
                  {['Technology', 'Education', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Consulting', 'Government', 'Other'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Company Size</label>
                <select className="form-input" value={hiringForm.companySize} onChange={e => updateForm('companySize', e.target.value)}>
                  {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Website</label><input className="form-input" value={hiringForm.companyWebsite} onChange={e => updateForm('companyWebsite', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={hiringForm.companyLocation} onChange={e => updateForm('companyLocation', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Company Description</label><textarea className="form-textarea" value={hiringForm.companyDescription} onChange={e => updateForm('companyDescription', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>{loading ? '🔄 Creating...' : '🚀 Create Account'}</button>
            </div>
          </>
        )}

        {/* Login Link */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
