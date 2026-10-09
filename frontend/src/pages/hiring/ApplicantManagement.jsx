import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationAPI, jobAPI } from '../../services/api';

export default function ApplicantManagement() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => { loadData(); }, [jobId]);

  const loadData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        jobAPI.getJobById(jobId),
        applicationAPI.getApplicationsByJob(jobId)
      ]);
      setJob(jobRes.data.data);
      setApplications(appsRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (appId, status, reason = '') => {
    try {
      await applicationAPI.updateStatus(appId, { status, reason });
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.matchScore?.overall || 0) - (a.matchScore?.overall || 0);
    if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'risk') {
      const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (riskOrder[b.resumeContentRisk] || 0) - (riskOrder[a.resumeContentRisk] || 0);
    }
    return 0;
  });

  const filters = ['ALL', 'ELIGIBLE', 'NEEDS_REVIEW', 'REJECTED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'SCREENING'];
  const counts = {};
  filters.forEach(f => { counts[f] = f === 'ALL' ? applications.length : applications.filter(a => a.status === f).length; });

  const RiskBadge = ({ level }) => {
    const colors = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
    return <span className={`badge badge-${colors[level] || 'secondary'}`} style={{ fontSize: '0.7rem' }}>{level || 'N/A'}</span>;
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <p style={{ marginBottom: '0.25rem' }}><Link to="/hiring/jobs" style={{ color: 'var(--text-muted)' }}>← Back to Jobs</Link></p>
        <h1>{job?.title || 'Job'} — Applicants</h1>
        <p>{applications.length} total applications</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: counts.ALL, color: 'var(--text-primary)', icon: '📊' },
          { label: 'Eligible', count: counts.ELIGIBLE, color: 'var(--success-500)', icon: '✅' },
          { label: 'Review', count: counts.NEEDS_REVIEW, color: 'var(--warning-500)', icon: '⚠️' },
          { label: 'Rejected', count: counts.REJECTED, color: 'var(--danger-500)', icon: '❌' },
          { label: 'Shortlisted', count: counts.SHORTLISTED, color: 'var(--primary-500)', icon: '⭐' },
          { label: 'Interview', count: counts.INTERVIEW, color: 'var(--accent-500)', icon: '📅' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '0.75rem', cursor: 'pointer' }}
            onClick={() => setFilter(s.label === 'Total' ? 'ALL' : s.label === 'Review' ? 'NEEDS_REVIEW' : s.label.toUpperCase())}>
            <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="tabs" style={{ overflowX: 'auto' }}>
          {filters.map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? `All (${counts.ALL})` : `${f.replace('_', ' ')} (${counts[f]})`}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          <option value="score">Sort: Match Score</option>
          <option value="date">Sort: Date</option>
          <option value="risk">Sort: Risk Level</option>
        </select>
      </div>

      {/* Applications List */}
      {sorted.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {sorted.map(app => (
            <div key={app.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Left: Applicant Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                      {(app.applicantProfileId || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{app.applicantProfileId || 'Applicant'}</div>
                      <span className={`badge badge-${app.status?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{app.status}</span>
                    </div>
                  </div>
                  {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>📄 View Resume</a>}
                </div>

                {/* Center: Score Breakdown */}
                <div style={{ flex: 2, minWidth: 280 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Match:</span> <strong>{app.matchScore?.overall ? `${Math.round(app.matchScore.overall)}%` : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Skills:</span> <strong>{app.skillsMatchScore ? `${Math.round(app.skillsMatchScore)}%` : app.matchScore?.skillsMatch ? `${Math.round(app.matchScore.skillsMatch)}%` : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Experience:</span> <strong>{app.experienceMatchScore ? `${Math.round(app.experienceMatchScore)}%` : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Qualification:</span> <strong>{app.qualificationMatchScore ? `${Math.round(app.qualificationMatchScore)}%` : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Resume Risk:</span> <RiskBadge level={app.resumeContentRisk} /></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>AI Risk:</span> <RiskBadge level={app.aiContentRisk} /></div>
                  </div>
                  {app.eligibilityExplanation && app.status !== 'REJECTED' && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.4 }}>{app.eligibilityExplanation.substring(0, 150)}{app.eligibilityExplanation.length > 150 ? '...' : ''}</p>
                  )}
                  {app.rejectionReason && app.status === 'REJECTED' && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--danger-500)', marginTop: '0.4rem' }}>❌ {app.rejectionReason.substring(0, 120)}...</p>
                  )}
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                  <Link to={`/applications/${app.id}`}><button className="btn btn-ghost btn-sm">View Details</button></Link>
                  {app.status === 'ELIGIBLE' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(app.id, 'SHORTLISTED')}>⭐ Shortlist</button>}
                  {app.status === 'SHORTLISTED' && <button className="btn btn-sm btn-accent" onClick={() => updateStatus(app.id, 'INTERVIEW')}>📅 Interview</button>}
                  {app.status === 'NEEDS_REVIEW' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => updateStatus(app.id, 'ELIGIBLE', 'Approved after review')}>✓ Approve</button>
                      <button className="btn btn-sm btn-danger" onClick={() => updateStatus(app.id, 'REJECTED', 'Rejected after review')}>✗ Reject</button>
                    </>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><h3>No Applications</h3><p>No applications match the selected filter.</p></div></div>
      )}
    </div>
  );
}
