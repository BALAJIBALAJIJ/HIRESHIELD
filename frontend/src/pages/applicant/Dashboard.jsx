import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, jobAPI } from '../../services/api';

export default function ApplicantDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, jobsRes] = await Promise.all([
        dashboardAPI.getApplicantDashboard(),
        jobAPI.getMarketplace()
      ]);
      setStats(dashRes.data.data);
      setRecommendedJobs((jobsRes.data.data || []).slice(0, 6));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  const statCards = [
    { label: 'Total Applications', value: stats?.totalApplications || 0, icon: '📄', color: 'blue' },
    { label: 'Screening', value: stats?.screeningCount || 0, icon: '🔍', color: 'yellow' },
    { label: 'Eligible', value: stats?.eligibleCount || 0, icon: '✅', color: 'green' },
    { label: 'Rejected', value: stats?.rejectedCount || 0, icon: '❌', color: 'red' },
    { label: 'Shortlisted', value: stats?.shortlistedCount || 0, icon: '⭐', color: 'purple' },
    { label: 'Interview', value: stats?.interviewCount || 0, icon: '🎤', color: 'blue' },
  ];

  const statusPipeline = ['APPLIED', 'SCREENING', 'ELIGIBLE', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p>{profile?.professionalTitle || 'Job Seeker'} • {profile?.location || ''}</p>
        </div>
        <Link to="/jobs/marketplace"><button className="btn btn-primary">🔍 Find Jobs</button></Link>
      </div>

      {/* Profile Completion Banner */}
      {(!profile?.resumeUrl || !profile?.skills?.length) && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: 'var(--warning-500)' }}>⚠️ Complete Your Profile</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {!profile?.resumeUrl ? 'Upload your resume' : 'Add your skills'} to improve your match scores and get better recommendations.
            </p>
          </div>
          <Link to="/profile"><button className="btn btn-secondary btn-sm">Complete Profile</button></Link>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Application Pipeline */}
      {stats?.recentApplications?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Your Applications</h3>
            <Link to="/applicant/applications"><button className="btn btn-ghost btn-sm">View All →</button></Link>
          </div>
          <table className="data-table">
            <thead><tr><th>Job</th><th>Status</th><th>Match Score</th><th>Pipeline</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {stats.recentApplications.slice(0, 5).map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.jobId}</td>
                  <td><span className={`badge badge-${app.status?.toLowerCase()}`}>{app.status}</span></td>
                  <td>{app.matchScore?.overall ? `${Math.round(app.matchScore.overall)}%` : '—'}</td>
                  <td>
                    <div className="status-pipeline">
                      {statusPipeline.map((s, i) => {
                        const idx = statusPipeline.indexOf(app.status);
                        const isRejected = app.status === 'REJECTED';
                        return (
                          <span key={s}>
                            <span className={`pipeline-step ${i <= idx && !isRejected ? (i === idx ? 'active' : 'completed') : isRejected && i === 0 ? 'rejected' : ''}`}>
                              {s.charAt(0)}
                            </span>
                            {i < statusPipeline.length - 1 && <span className="pipeline-arrow">›</span>}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</td>
                  <td><Link to={`/applications/${app.id}`}><button className="btn btn-ghost btn-sm">View</button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentApplications.some(a => a.status === 'REJECTED' && a.rejectionReason) && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--danger-500)' }}>Rejection Reasons:</strong>
              {stats.recentApplications.filter(a => a.status === 'REJECTED' && a.rejectionReason).map(a => (
                <p key={a.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>• {a.rejectionReason}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Jobs */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recommended Jobs</h3>
          <Link to="/jobs/marketplace"><button className="btn btn-ghost btn-sm">View All →</button></Link>
        </div>
        {recommendedJobs.length > 0 ? (
          <div className="jobs-grid" style={{ marginTop: '0.5rem' }}>
            {recommendedJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none' }}>
                <div className="job-card">
                  <div className="job-card-header">
                    <div className="job-card-logo">{job.title?.charAt(0) || 'J'}</div>
                    <div>
                      <div className="job-card-title">{job.title}</div>
                      <div className="job-card-company">{job.location || 'Remote'} • {job.workMode}</div>
                    </div>
                  </div>
                  <div className="job-card-tags">
                    {job.requiredSkills?.slice(0, 4).map((s, i) => <span key={i} className="job-tag">{s}</span>)}
                  </div>
                  <div className="job-card-footer">
                    <span className="job-meta">{job.employmentType?.replace('_', ' ')}</span>
                    <span className="job-meta">{job.requiredExperience || 'Any'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-icon">💼</div><h3>No Jobs Available</h3><p>Check back later for new opportunities.</p></div>
        )}
      </div>
    </div>
  );
}
