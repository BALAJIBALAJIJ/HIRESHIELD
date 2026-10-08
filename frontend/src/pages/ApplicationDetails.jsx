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

  return (
    <div className="main-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <p style={{ marginBottom: '0.25rem' }}>
          <Link to={isHiringTeam ? `/hiring/jobs/${app.jobId}/applicants` : '/applicant/applications'} style={{ color: 'var(--text-muted)' }}>← Back</Link>
        </p>
        <h1>Application Details</h1>
      </div>

      {/* Status & Score Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className={`badge badge-${app.status?.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>{app.status}</span>
              {app.resumeContentRisk && (
                <span className={`badge badge-${app.resumeContentRisk === 'LOW' ? 'success' : app.resumeContentRisk === 'HIGH' ? 'danger' : 'warning'}`}>
                  AI Risk: {app.resumeContentRisk} ({Math.round((app.resumeAiConfidence || 0) * 100)}%)
                </span>
              )}
            </div>
            {app.eligibilityExplanation && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 600 }}>{app.eligibilityExplanation}</p>}
            {app.rejectionReason && (
              <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--danger-500)', marginTop: '0.5rem' }}>
                <strong>Rejection Reason: </strong>{app.rejectionReason}
              </div>
            )}
          </div>
          {score && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: score.overall >= 70 ? 'var(--success-500)' : score.overall >= 50 ? 'var(--warning-500)' : 'var(--danger-500)' }}>
                {Math.round(score.overall)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Match Score</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Match Score Breakdown */}
        {score && (
          <div className="card">
            <h3 className="card-title">Match Score Breakdown</h3>
            <div style={{ marginTop: '1rem' }}>
              {[
                ['Skills Match', score.skillsMatch],
                ['Experience Match', score.experienceMatch],
                ['Qualification Match', score.qualificationMatch],
                ['Mandatory Criteria', score.mandatoryCriteriaMatch],
                ['Job Relevance', score.jobRelevance],
              ].map(([label, value], i) => (
                <div key={i} style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{value != null ? `${Math.round(value)}%` : '—'}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-bar-fill ${(value || 0) >= 70 ? 'green' : (value || 0) >= 50 ? 'yellow' : 'red'}`}
                         style={{ width: `${value || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {score.explanation && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>{score.explanation}</p>}
          </div>
        )}

        {/* Screening Criteria Results */}
        {screeningResult?.criteriaResults?.length > 0 && (
          <div className="card">
            <h3 className="card-title">Screening Criteria</h3>
            <div style={{ marginTop: '1rem' }}>
              {screeningResult.criteriaResults.map((cr, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0', borderBottom: i < screeningResult.criteriaResults.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ fontSize: '1.1rem' }}>{cr.satisfied ? '✅' : '❌'}</span>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${cr.type === 'MANDATORY' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{cr.type}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cr.category}: {cr.requirement}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{cr.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
            {screeningResult.matchedSkills?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--success-500)' }}>Matched Skills: </strong>
                {screeningResult.matchedSkills.map((s, i) => <span key={i} className="badge badge-success" style={{ marginRight: '0.3rem', marginTop: '0.3rem' }}>{s}</span>)}
              </div>
            )}
            {screeningResult.missingSkills?.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--danger-500)' }}>Missing Skills: </strong>
                {screeningResult.missingSkills.map((s, i) => <span key={i} className="badge badge-danger" style={{ marginRight: '0.3rem', marginTop: '0.3rem' }}>{s}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screening Answers */}
      {screeningAnswers.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">Screening Answers</h3>
          {screeningAnswers.map((sa, i) => (
            <div key={sa.id} style={{ padding: '1rem', background: 'var(--bg-glass)', borderRadius: '10px', marginTop: '0.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>Q{i + 1}: {sa.question}</strong>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge badge-${sa.evaluationStatus === 'RELEVANT' ? 'success' : sa.evaluationStatus === 'IRRELEVANT' ? 'danger' : 'warning'}`}>{sa.evaluationStatus}</span>
                  <span className={`badge badge-${sa.aiContentRisk === 'LOW' ? 'success' : sa.aiContentRisk === 'HIGH' ? 'danger' : 'warning'}`}>AI: {sa.aiContentRisk}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{sa.answer}</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Relevance: {Math.round(sa.relevanceScore || 0)}%</span>
                <span>AI Confidence: {Math.round((sa.aiConfidence || 0) * 100)}%</span>
              </div>
              {sa.evaluationExplanation && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>{sa.evaluationExplanation}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Status History */}
      {app.statusHistory?.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">Status History</h3>
          <div style={{ marginTop: '1rem' }}>
            {app.statusHistory.map((sh, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: i < app.statusHistory.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', marginTop: '0.5rem', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {sh.fromStatus && <span className="badge badge-applied" style={{ fontSize: '0.65rem' }}>{sh.fromStatus}</span>}
                    {sh.fromStatus && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    <span className={`badge badge-${sh.toStatus?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{sh.toStatus}</span>
                  </div>
                  {sh.reason && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{sh.reason}</p>}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sh.changedAt ? new Date(sh.changedAt).toLocaleString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Notes (Hiring Team only) */}
      {isHiringTeam && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">Internal Notes</h3>
          {app.internalNotes?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              {app.internalNotes.map((note, i) => (
                <div key={i} style={{ padding: '0.6rem', background: 'var(--bg-glass)', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <p>{note.note}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{note.addedByName} • {note.addedAt ? new Date(note.addedAt).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <input className="form-input" placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
            <button className="btn btn-secondary" onClick={addNote}>Add</button>
          </div>
        </div>
      )}

      {/* Resume Link */}
      {app.resumeUrl && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">📄 View / Download Resume</a>
        </div>
      )}
    </div>
  );
}
