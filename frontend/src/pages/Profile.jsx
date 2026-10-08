import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import {
  validatePhone, validateLocation, validateEducation, validateExperience,
  validateLinkedIn, validateGitHub, validateSkills, validateProfessionalTitle,
  validateApplicantProfile, LOCATIONS, SKILLS_LIST, ALL_SKILLS,
} from '../utils/validators';

// Resume storage helper
function getResumes() {
  try { return JSON.parse(localStorage.getItem('hireshield_resumes') || '[]'); } catch { return []; }
}
function saveResumes(resumes) { localStorage.setItem('hireshield_resumes', JSON.stringify(resumes)); }

export default function Profile() {
  const { user, profile, organization, isHiringTeam, isApplicant, loadProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [orgData, setOrgData] = useState({});
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Skills UI
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [otherSkill, setOtherSkill] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  useEffect(() => {
    setResumes(getResumes().filter(r => r.userId === user?.id));
  }, [user]);

  const startEdit = () => {
    setEditData(profile ? { ...profile, skills: [...(profile.skills || [])] } : {});
    setOrgData(organization ? { ...organization } : {});
    setErrors({});
    setEditing(true);
    setSuccessMsg('');
  };

  const handleSave = async () => {
    // Validate before saving
    if (isApplicant) {
      const validationErrors = validateApplicantProfile(editData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setSaving(true);
    try {
      if (isApplicant) {
        await profileAPI.updateApplicantProfile({
          ...editData,
          yearsOfExperience: Number(editData.yearsOfExperience) || 0,
        });
      } else {
        await profileAPI.updateHiringTeamProfile(editData);
        if (orgData.companyName) await profileAPI.updateOrganization(orgData);
      }
      await loadProfile();
      setEditing(false);
      setSuccessMsg('✅ Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert('Failed to save: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const updateField = (field, value) => {
    setEditData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const blurValidate = (field) => {
    let err = '';
    switch (field) {
      case 'phone': err = validatePhone(editData.phone); break;
      case 'professionalTitle': err = validateProfessionalTitle(editData.professionalTitle); break;
      case 'location': err = validateLocation(editData.location); break;
      case 'education': err = validateEducation(editData.education); break;
      case 'yearsOfExperience': err = validateExperience(editData.yearsOfExperience); break;
      case 'linkedinUrl': err = validateLinkedIn(editData.linkedinUrl); break;
      case 'githubUrl': err = validateGitHub(editData.githubUrl); break;
      case 'skills': err = validateSkills(editData.skills); break;
    }
    if (err) setErrors(p => ({ ...p, [field]: err }));
  };

  // Skills management
  const addSkill = (skill) => {
    if (!editData.skills?.includes(skill)) {
      const newSkills = [...(editData.skills || []), skill];
      setEditData(p => ({ ...p, skills: newSkills }));
      if (errors.skills) setErrors(p => ({ ...p, skills: '' }));
    }
    setSkillSearch(''); setShowSkillDropdown(false);
  };
  const removeSkill = (skill) => { setEditData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) })); };
  const addOtherSkill = () => {
    if (otherSkill.trim()) { addSkill(otherSkill.trim()); setOtherSkill(''); setShowOtherInput(false); }
  };
  const filteredSkills = skillSearch.trim() ? ALL_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !editData.skills?.includes(s)) : [];

  // File uploads
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try {
      if (type === 'photo') await profileAPI.uploadPhoto(formData);
      else if (type === 'logo') await profileAPI.uploadLogo(formData);
      await loadProfile();
    } catch (err) { alert('Upload failed'); }
  };

  // Resume management
  const handleResumeUpload = (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setUploading(true);
    let processed = 0;
    files.forEach(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!['.pdf', '.doc', '.docx'].includes(ext)) { alert(`"${file.name}" not supported.`); processed++; if (processed === files.length) setUploading(false); return; }
      if (file.size > 5 * 1024 * 1024) { alert(`"${file.name}" too large (max 5MB).`); processed++; if (processed === files.length) setUploading(false); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const allResumes = getResumes();
        allResumes.push({ id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), userId: user.id, fileName: file.name, fileSize: file.size, fileType: file.type || ext, dataUrl: reader.result, uploadedAt: new Date().toISOString() });
        saveResumes(allResumes); setResumes(allResumes.filter(r => r.userId === user.id));
        processed++; if (processed === files.length) setUploading(false);
      };
      reader.onerror = () => { processed++; if (processed === files.length) setUploading(false); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const handleResumeDownload = (resume) => { const a = document.createElement('a'); a.href = resume.dataUrl; a.download = resume.fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const handleResumeDelete = (id) => { if (!confirm('Delete this resume?')) return; const all = getResumes().filter(r => r.id !== id); saveResumes(all); setResumes(all.filter(r => r.userId === user?.id)); };
  const formatFileSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

  const FieldError = ({ field }) => errors[field] ? <p style={{ color: 'var(--danger-500)', fontSize: '0.8rem', marginTop: '0.3rem' }}>⚠️ {errors[field]}</p> : null;
  const fs = (field) => ({ borderColor: errors[field] ? 'var(--danger-500)' : undefined, boxShadow: errors[field] ? '0 0 0 2px rgba(239,68,68,0.2)' : undefined });

  return (
    <div className="main-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>My Profile</h1><p>Manage your professional information</p></div>
        {!editing ? (
          <button className="btn btn-primary" onClick={startEdit}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      </div>

      {successMsg && <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: 'var(--success-500)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 600 }}>{successMsg}</div>}

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary-600), var(--accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', overflow: 'hidden' }}>
              {profile?.profilePhotoUrl ? <img src={profile.profilePhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : user?.fullName?.charAt(0) || 'U'}
            </div>
            <label style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem' }}>📷<input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e, 'photo')} /></label>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)' }}>{user?.fullName}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* ===== APPLICANT PROFILE ===== */}
      {isApplicant && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Professional Information</h3>
            {!editing ? (
              <div>
                {[
                  ['Professional Title', profile?.professionalTitle],
                  ['Phone', profile?.phone],
                  ['Location', profile?.location],
                  ['Education', profile?.education],
                  ['Experience', `${profile?.yearsOfExperience || 0} years`],
                  ['GitHub', profile?.githubUrl],
                  ['LinkedIn', profile?.linkedinUrl],
                  ['Portfolio', profile?.portfolioUrl],
                ].map(([label, val], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: val ? 'var(--text-primary)' : 'var(--text-muted)' }}>{val || 'Not set'}</span>
                  </div>
                ))}
                {profile?.skills?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Skills:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {profile.skills.map((s, i) => <span key={i} className="badge badge-info">{s}</span>)}
                    </div>
                  </div>
                )}
                {profile?.professionalSummary && (
                  <div style={{ marginTop: '1rem' }}><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Summary:</span><p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{profile.professionalSummary}</p></div>
                )}
              </div>
            ) : (
              /* ===== EDIT MODE WITH VALIDATION ===== */
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Professional Title *</label>
                    <input className="form-input" style={fs('professionalTitle')} value={editData.professionalTitle || ''}
                      onChange={e => updateField('professionalTitle', e.target.value)} onBlur={() => blurValidate('professionalTitle')} />
                    <FieldError field="professionalTitle" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(10 digits)</span></label>
                    <input className="form-input" style={fs('phone')} maxLength={10} value={editData.phone || ''}
                      onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} onBlur={() => blurValidate('phone')} />
                    <FieldError field="phone" />
                    {editData.phone && !errors.phone && <p style={{ color: 'var(--success-500)', fontSize: '0.75rem', marginTop: '0.2rem' }}>✓ {editData.phone.length}/10 digits</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location *</label>
                    <select className="form-input" style={{ ...fs('location'), cursor: 'pointer' }} value={editData.location || ''}
                      onChange={e => updateField('location', e.target.value)} onBlur={() => blurValidate('location')}>
                      <option value="">— Select Location —</option>
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <FieldError field="location" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(0–80)</span></label>
                    <input className="form-input" type="number" min="0" max="80" style={fs('yearsOfExperience')} value={editData.yearsOfExperience ?? ''}
                      onChange={e => updateField('yearsOfExperience', e.target.value)} onBlur={() => blurValidate('yearsOfExperience')} />
                    <FieldError field="yearsOfExperience" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Education *</label>
                  <input className="form-input" style={fs('education')} value={editData.education || ''}
                    onChange={e => updateField('education', e.target.value)} onBlur={() => blurValidate('education')} />
                  <FieldError field="education" />
                </div>

                {/* Skills Editor */}
                <div className="form-group">
                  <label className="form-label">Skills *</label>
                  {editData.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {editData.skills.map(skill => (
                        <span key={skill} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', paddingRight: '0.3rem' }}>
                          {skill}
                          <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem', opacity: 0.7 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" style={fs('skills')} placeholder="🔍 Search skills..." value={skillSearch}
                      onChange={e => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }} onFocus={() => setShowSkillDropdown(true)} />
                    {showSkillDropdown && skillSearch.trim() && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        {filteredSkills.length > 0 ? filteredSkills.slice(0, 15).map(skill => (
                          <div key={skill} onClick={() => addSkill(skill)} style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}
                            onMouseOver={e => e.target.style.background = 'var(--bg-glass)'} onMouseOut={e => e.target.style.background = 'transparent'}>{skill}</div>
                        )) : <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No match. Use "Other" to add custom.</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    {!showOtherInput ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowOtherInput(true)} style={{ fontSize: '0.8rem' }}>➕ Add Other Skill</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input className="form-input" placeholder="Type custom skill..." value={otherSkill} onChange={e => setOtherSkill(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOtherSkill(); } }} style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" onClick={addOtherSkill} disabled={!otherSkill.trim()}>Add</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setShowOtherInput(false); setOtherSkill(''); }}>Cancel</button>
                      </div>
                    )}
                  </div>
                  <FieldError field="skills" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">LinkedIn URL</label>
                    <input className="form-input" style={fs('linkedinUrl')} placeholder="https://www.linkedin.com/in/username" value={editData.linkedinUrl || ''}
                      onChange={e => updateField('linkedinUrl', e.target.value)} onBlur={() => blurValidate('linkedinUrl')} />
                    <FieldError field="linkedinUrl" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GitHub URL</label>
                    <input className="form-input" style={fs('githubUrl')} placeholder="https://github.com/username" value={editData.githubUrl || ''}
                      onChange={e => updateField('githubUrl', e.target.value)} onBlur={() => blurValidate('githubUrl')} />
                    <FieldError field="githubUrl" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Summary</label>
                  <textarea className="form-textarea" value={editData.professionalSummary || ''} onChange={e => updateField('professionalSummary', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Resume Management */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div><h3 className="card-title">My Resumes</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Upload, manage and download your resumes.</p></div>
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploading ? '⏳ Uploading...' : '📄 Upload Resume'}
                <input type="file" hidden accept=".pdf,.doc,.docx" multiple onChange={handleResumeUpload} disabled={uploading} />
              </label>
            </div>
            {resumes.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                {resumes.map((resume, i) => (
                  <div key={resume.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: i < resumes.length - 1 ? '0.75rem' : 0, border: '1px solid var(--border-color)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '10px', background: resume.fileName.endsWith('.pdf') ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      {resume.fileName.endsWith('.pdf') ? '📕' : '📘'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume.fileName}</p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>{formatFileSize(resume.fileSize)}</span>
                        <span>{new Date(resume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleResumeDownload(resume)}>⬇️ Download</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleResumeDelete(resume.id)} style={{ color: 'var(--danger-500)' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.5 }}>📄</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No resumes uploaded yet</p>
                <label className="btn btn-primary" style={{ marginTop: '1rem', cursor: 'pointer' }}>Upload Resume<input type="file" hidden accept=".pdf,.doc,.docx" multiple onChange={handleResumeUpload} /></label>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== HIRING TEAM PROFILE ===== */}
      {isHiringTeam && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Professional Information</h3>
            {!editing ? (
              <div>
                {[['Designation', profile?.designation], ['Department', profile?.department], ['Experience', `${profile?.yearsOfExperience || 0} years`]].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || 'Not set'}</span>
                  </div>
                ))}
                {profile?.bio && <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{profile.bio}</p>}
              </div>
            ) : (
              <div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Designation</label><input className="form-input" value={editData.designation || ''} onChange={e => updateField('designation', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={editData.department || ''} onChange={e => updateField('department', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" value={editData.bio || ''} onChange={e => updateField('bio', e.target.value)} /></div>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Organization</h3>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>📷 Logo<input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e, 'logo')} /></label>
            </div>
            {!editing ? (
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {organization?.companyLogoUrl ? <img src={organization.companyLogoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '🏢'}
                  </div>
                  <div><p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{organization?.companyName || 'Not set'}</p><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{organization?.industry} • {organization?.companySize}</p></div>
                </div>
                {[['Website', organization?.companyWebsite], ['Location', organization?.companyLocation]].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || 'Not set'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={orgData.companyName || ''} onChange={e => setOrgData(p => ({ ...p, companyName: e.target.value }))} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Industry</label><input className="form-input" value={orgData.industry || ''} onChange={e => setOrgData(p => ({ ...p, industry: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={orgData.companyLocation || ''} onChange={e => setOrgData(p => ({ ...p, companyLocation: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={orgData.companyDescription || ''} onChange={e => setOrgData(p => ({ ...p, companyDescription: e.target.value }))} /></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
