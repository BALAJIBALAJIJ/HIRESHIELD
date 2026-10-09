import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationAPI } from '../services/api';

export default function ApplicationDetails() {
  const { applicationId } = useParams();
  const { isHiringTeam } = useAuth();
  const [app, setApp] = useState(null);
  const [screeningResult, setScreeningResult] = useState(null);
  const [screeningAnswers, setScreeningAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadData(); }, [applicationId]);

  const loadData = async () => {
    try {
      const [appRes, resultRes, answersRes] = await Promise.all([
        applicationAPI.getApplication(applicationId),
        applicationAPI.getScreeningResult(applicationId).catch(() => null),
        applicationAPI.getScreeningAnswers(applicationId).catch(() => null),
      ]);
      setApp(appRes.data.data);
      setScreeningResult(resultRes?.data?.data || null);
      setScreeningAnswers(answersRes?.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status, reason) => {
    try {
      await applicationAPI.updateStatus(applicationId, { status, reason });
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await applicationAPI.addNote(applicationId, { note: noteText });
      setNoteText('');
      loadData();
    } catch (err) { alert('Failed to add note'); }
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;
  if (!app) return <div className="main-content"><div className="empty-state"><h3>Application not found</h3></div></div>;

  const score = app.matchScore;
  const sr = screeningResult;

  const ScoreBar = ({ label, value, max = 100 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{ width: 180, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value || 0, max)}%`, height: '100%', borderRadius: 4,
          background: (value || 0) >= 70 ? 'var(--success-500)' : (value || 0) >= 50 ? 'var(--warning-500)' : 'var(--danger-500)',
          transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 40, textAlign: 'right' }}>{value != null ? `${Math.round(value)}%` : '—'}</span>
    </div>
  );

  const RiskBadge = ({ level }) => {
    const colors = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
    return <span className={`badge badge-${colors[level] || 'secondary'}`}>{level || 'N/A'}</span>;
  };

  const tabs = ['overview', 'scores', 'screening', 'answers'];
  if (isHiringTeam) tabs.push('notes');

  return (
    <div className="main-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <p style={{ marginBottom: '0.25rem' }}>
          <Link to={isHiringTeam ? `/hiring/jobs/${app.jobId}/applicants` : '/applicant/applications'} style={{ color: 'var(--text-muted)' }}>← Back</Link>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Application Details</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${app.status?.toLowerCase()}`} style={{ fontSize: '0.9rem' }}>{app.status}</span>
              {score?.overall != null && <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Match: {Math.round(score.overall)}%</span>}
              {app.needsHumanReview && <span className="badge badge-warning">⚠ Needs Review</span>}
            </div>
          </div>
          {isHiringTeam && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(app.status === 'ELIGIBLE' || app.status === 'NEEDS_REVIEW') && (
                <button className="btn btn-primary btn-sm" onClick={() => updateStatus('SHORTLISTED', 'Shortlisted by hiring team')}>✓ Shortlist</button>
              )}
              {app.status === 'NEEDS_REVIEW' && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus('ELIGIBLE', 'Approved after manual review')}>✓ Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus('REJECTED', 'Rejected after manual review')}>✗ Reject</button>
                </>
              )}
              {app.status === 'SHORTLISTED' && (
                <button className="btn btn-accent btn-sm" onClick={() => updateStatus('INTERVIEW', 'Scheduled for interview')}>📅 Interview</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {app.status === 'REJECTED' && app.rejectionReason && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>❌</span>
            <div><strong style={{ color: 'var(--danger-500)' }}>Application Rejected</strong><p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{app.rejectionReason}</p></div>
          </div>
        </div>
      )}
      {app.status === 'NEEDS_REVIEW' && (
        <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div><strong style={{ color: 'var(--warning-500)' }}>Under Review</strong><p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>This application requires human review. The AI screening found some items that need manual verification.</p></div>
          </div>
        </div>
      )}
      {app.status === 'ELIGIBLE' && app.eligibilityExplanation && (
        <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <div><strong style={{ color: 'var(--success-500)' }}>Eligible</strong><p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{app.eligibilityExplanation}</p></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="card">
            <h3 className="card-title">📋 Application Info</h3>
            <div style={{ fontSize: '0.85rem', display: 'grid', gap: '0.4rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Job ID:</span> {app.jobId}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Applied:</span> {app.createdAt ? new Date(app.createdAt).toLocaleString() : '—'}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge badge-${app.status?.toLowerCase()}`}>{app.status}</span></div>
              {app.resumeUrl && <div><a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }}>📄 View Resume</a></div>}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">🎯 Match Score Summary</h3>
            {score ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: score.overall >= 70 ? 'var(--success-500)' : score.overall >= 50 ? 'var(--warning-500)' : 'var(--danger-500)' }}>
                    {Math.round(score.overall)}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Match</div>
                </div>
                <ScoreBar label="Skills Match" value={score.skillsMatch} />
                <ScoreBar label="Experience Match" value={score.experienceMatch} />
                <ScoreBar label="Qualification Match" value={score.qualificationMatch} />
                <ScoreBar label="Mandatory Criteria" value={score.mandatoryCriteriaMatch} />
              </div>
            ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No score data available</p>}
          </div>

          <div className="card">
            <h3 className="card-title">🛡️ Risk Assessment</h3>
            <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Resume AI Content Risk</span><RiskBadge level={app.resumeContentRisk} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>AI Content Risk</span><RiskBadge level={app.aiContentRisk} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Resume Authenticity</span><RiskBadge level={app.resumeAuthenticityRisk} />
              </div>
              {app.resumeAiConfidence > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  AI detection confidence: {Math.round(app.resumeAiConfidence * 100)}%
                  <br /><em>Note: AI content detection is probabilistic and should not be treated as definitive.</em>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCORES TAB */}
      {activeTab === 'scores' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>📊 Detailed Score Breakdown</h3>
          <ScoreBar label="Skills Match" value={app.skillsMatchScore || score?.skillsMatch} />
          <ScoreBar label="Experience Match" value={app.experienceMatchScore || score?.experienceMatch} />
          <ScoreBar label="Qualification Match" value={app.qualificationMatchScore || score?.qualificationMatch} />
          <ScoreBar label="Mandatory Criteria" value={app.mandatoryScore || score?.mandatoryCriteriaMatch} />
          <ScoreBar label="Preferred Criteria" value={app.preferredScore} />
          <ScoreBar label="Answer Relevance" value={app.answerRelevanceScore} />
          <ScoreBar label="Profile-Resume Consistency" value={app.profileResumeConsistencyScore} />
          <ScoreBar label="Cross-Validation" value={app.crossValidationScore} />

          {sr && (
            <>
              {sr.matchedSkills?.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>✅ Matched Skills</h4>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {sr.matchedSkills.map((s, i) => <span key={i} className="badge badge-success">{s}</span>)}
                  </div>
                </div>
              )}
              {sr.missingSkills?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>❌ Missing Skills</h4>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {sr.missingSkills.map((s, i) => <span key={i} className="badge badge-danger">{s}</span>)}
                  </div>
                </div>
              )}
              {sr.failedRequirements?.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--danger-500)', marginBottom: '0.5rem' }}>⛔ Failed Mandatory Requirements</h4>
                  {sr.failedRequirements.map((r, i) => <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>• {r}</div>)}
                </div>
              )}
              {sr.warnings?.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245,158,11,0.06)', borderRadius: 8 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--warning-500)', marginBottom: '0.5rem' }}>⚠️ Warnings</h4>
                  {sr.warnings.map((w, i) => <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>• {w}</div>)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SCREENING TAB */}
      {activeTab === 'screening' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {sr ? (
            <>
              <div className="card">
                <h3 className="card-title">🤖 AI Screening Summary</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{sr.overallExplanation}</p>
                {sr.reasons?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Reasons:</h4>
                    {sr.reasons.map((r, i) => <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.3rem', padding: '0.4rem 0.6rem', background: 'var(--bg-glass)', borderRadius: 6 }}>💡 {r}</div>)}
                  </div>
                )}
              </div>

              {sr.criteriaResults?.length > 0 && (
                <div className="card">
                  <h3 className="card-title">📋 Criteria Evaluation</h3>
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead><tr><th>Category</th><th>Requirement</th><th>Type</th><th>Status</th><th>Explanation</th></tr></thead>
                    <tbody>
                      {sr.criteriaResults.map((cr, i) => (
                        <tr key={i}>
                          <td>{cr.category}</td>
                          <td style={{ fontWeight: 600 }}>{cr.requirement}</td>
                          <td><span className={`badge badge-${cr.type === 'MANDATORY' ? 'danger' : 'secondary'}`}>{cr.type}</span></td>
                          <td>{cr.satisfied ? '✅' : '❌'}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cr.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sr.inconsistencies?.length > 0 && (
                <div className="card">
                  <h3 className="card-title">🔍 Profile-Resume Inconsistencies</h3>
                  {sr.inconsistencies.map((inc, i) => (
                    <div key={i} style={{ padding: '0.6rem', background: 'var(--bg-glass)', borderRadius: 6, marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                      <strong>{inc.field}:</strong> Profile="{inc.profileValue}" vs Resume="{inc.resumeValue}"
                      <span className={`badge badge-${inc.severity === 'HIGH' ? 'danger' : inc.severity === 'MEDIUM' ? 'warning' : 'success'}`} style={{ marginLeft: '0.5rem' }}>{inc.severity}</span>
                    </div>
                  ))}
                </div>
              )}

              {sr.contradictions?.length > 0 && (
                <div className="card">
                  <h3 className="card-title">⚡ Cross-Validation Issues</h3>
                  {sr.contradictions.map((c, i) => (
                    <div key={i} style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.04)', borderRadius: 6, marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                      {c.source1} vs {c.source2}: <strong>{c.field}</strong> — "{c.value1}" vs "{c.value2}"
                      <span className={`badge badge-${c.severity === 'HIGH' ? 'danger' : 'warning'}`} style={{ marginLeft: '0.5rem' }}>{c.severity}</span>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{c.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card"><p style={{ color: 'var(--text-muted)' }}>Screening result not available yet.</p></div>
          )}
        </div>
      )}

      {/* ANSWERS TAB */}
      {activeTab === 'answers' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {screeningAnswers.length > 0 ? screeningAnswers.map((sa, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem' }}>Q{i + 1}: {sa.question}</h4>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span className={`badge badge-${sa.evaluationStatus === 'RELEVANT' ? 'success' : sa.evaluationStatus === 'IRRELEVANT' ? 'danger' : 'warning'}`}>{sa.evaluationStatus}</span>
                  <RiskBadge level={sa.aiContentRisk} />
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 8, fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{sa.answer}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Relevance: <strong>{Math.round(sa.relevanceScore)}%</strong></span>
                <span>AI Risk: <strong>{sa.aiContentRisk}</strong></span>
                <span>AI Confidence: <strong>{Math.round((sa.aiConfidence || 0) * 100)}%</strong></span>
              </div>
              {sa.evaluationExplanation && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sa.evaluationExplanation}</p>}
            </div>
          )) : (
            <div className="card"><p style={{ color: 'var(--text-muted)' }}>No screening answers submitted yet.</p></div>
          )}
        </div>
      )}

      {/* NOTES TAB (Hiring Team Only) */}
      {activeTab === 'notes' && isHiringTeam && (
        <div className="card">
          <h3 className="card-title">📝 Internal Notes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note..." style={{ flex: 1 }} className="input" onKeyDown={e => e.key === 'Enter' && addNote()} />
            <button className="btn btn-primary btn-sm" onClick={addNote} disabled={!noteText.trim()}>Add</button>
          </div>
          {app.internalNotes?.length > 0 ? app.internalNotes.map((note, i) => (
            <div key={i} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 6, marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>{note.addedByName || 'Team Member'}</span><span>{note.addedAt ? new Date(note.addedAt).toLocaleString() : ''}</span>
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>{note.note}</p>
            </div>
          )) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No notes yet.</p>}
        </div>
      )}

      {/* Status History */}
      {app.statusHistory?.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">📜 Status History</h3>
          {app.statusHistory.map((sh, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ minWidth: 6, height: 6, borderRadius: '50%', background: 'var(--primary-500)', marginTop: 6 }} />
              <div>
                {sh.fromStatus && <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{sh.fromStatus}</span>}
                {sh.fromStatus && ' → '}
                <span className={`badge badge-${sh.toStatus?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{sh.toStatus}</span>
                {sh.reason && <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>— {sh.reason}</span>}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sh.changedAt ? new Date(sh.changedAt).toLocaleString() : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
