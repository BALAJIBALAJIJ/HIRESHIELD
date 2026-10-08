import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationAPI, jobAPI } from '../../services/api';

export default function ApplicantManagement() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

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
  const filters = ['ALL', 'ELIGIBLE', 'REJECTED', 'NEEDS_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <p style={{ marginBottom: '0.25rem' }}><Link to="/hiring/jobs" style={{ color: 'var(--text-muted)' }}>← Back to Jobs</Link></p>
        <h1>{job?.title || 'Job'} — Applicants</h1>
        <p>{applications.length} total applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {filters.map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? `All (${applications.length})` : `${f.replace('_', ' ')} (${applications.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      {filtered.length > 0 ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Applicant</th><th>Match Score</th><th>Status</th><th>AI Risk</th><th>Skills Match</th><th>Applied</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{app.applicantProfileId}</div>
                    {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>📄 View Resume</a>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 60 }}>
                        <div className="progress-bar">
                          <div className={`progress-bar-fill ${(app.matchScore?.overall || 0) >= 70 ? 'green' : (app.matchScore?.overall || 0) >= 50 ? 'yellow' : 'red'}`}
                               style={{ width: `${app.matchScore?.overall || 0}%` }} />
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app.matchScore?.overall ? `${Math.round(app.matchScore.overall)}%` : '—'}</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${app.status?.toLowerCase()}`}>{app.status}</span></td>
                  <td><span className={`badge badge-${app.resumeContentRisk === 'LOW' ? 'success' : app.resumeContentRisk === 'HIGH' ? 'danger' : 'warning'}`}>{app.resumeContentRisk || 'N/A'}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {app.matchScore?.skillsMatch ? `${Math.round(app.matchScore.skillsMatch)}%` : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link to={`/applications/${app.id}`}><button className="btn btn-ghost btn-sm">Details</button></Link>
                      {app.status === 'ELIGIBLE' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(app.id, 'SHORTLISTED')}>Shortlist</button>}
                      {app.status === 'SHORTLISTED' && <button className="btn btn-sm btn-accent" onClick={() => updateStatus(app.id, 'INTERVIEW')}>Interview</button>}
                      {app.status === 'NEEDS_REVIEW' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(app.id, 'ELIGIBLE', 'Manually approved after review')}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => updateStatus(app.id, 'REJECTED', 'Rejected after manual review')}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><h3>No Applications</h3><p>No applications match the selected filter.</p></div></div>
      )}

      {/* Screening Explanation */}
      {filtered.some(a => a.eligibilityExplanation || a.rejectionReason) && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Screening Explanations</h3>
          {filtered.filter(a => a.eligibilityExplanation || a.rejectionReason).slice(0, 5).map(app => (
            <div key={app.id} style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span className={`badge badge-${app.status?.toLowerCase()}`} style={{ marginRight: '0.5rem' }}>{app.status}</span>
              {app.eligibilityExplanation || app.rejectionReason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
