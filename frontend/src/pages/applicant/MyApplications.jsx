import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../../services/api';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const res = await applicationAPI.getMyApplications();
      setApplications(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);
  const filters = ['ALL', 'APPLIED', 'SCREENING', 'ELIGIBLE', 'NEEDS_REVIEW', 'REJECTED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="main-content">
      <div className="page-header"><h1>My Applications</h1><p>Track all your job applications and their status</p></div>

      <div className="tabs" style={{ overflowX: 'auto' }}>
        {filters.map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? `All (${applications.length})` : `${f} (${applications.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map(app => (
            <div key={app.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{app.jobId}</span>
                  <span className={`badge badge-${app.status?.toLowerCase()}`}>{app.status}</span>
                </div>
                {app.matchScore?.overall != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Match Score:</span>
                    <div style={{ width: 100 }} className="progress-bar">
                      <div className={`progress-bar-fill ${app.matchScore.overall >= 70 ? 'green' : app.matchScore.overall >= 50 ? 'yellow' : 'red'}`} style={{ width: `${app.matchScore.overall}%` }} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{Math.round(app.matchScore.overall)}%</span>
                  </div>
                )}
                {app.status === 'REJECTED' && app.rejectionReason && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--danger-500)', marginTop: '0.5rem' }}>
                    <strong>Reason: </strong>{app.rejectionReason}
                  </div>
                )}
                {app.status === 'NEEDS_REVIEW' && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--warning-500)', marginTop: '0.5rem' }}>
                    ⚠️ Your application is currently under review by the hiring team.
                  </div>
                )}
                {app.eligibilityExplanation && app.status !== 'REJECTED' && app.status !== 'NEEDS_REVIEW' && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{app.eligibilityExplanation}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {app.resumeUrl && <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">📄 Resume</a>}
                <Link to={`/applications/${app.id}`}><button className="btn btn-secondary btn-sm">View Details</button></Link>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Applications</h3>
            <p>{filter === 'ALL' ? "You haven't applied to any jobs yet." : `No applications with status "${filter}".`}</p>
            <Link to="/jobs/marketplace"><button className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Jobs</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
