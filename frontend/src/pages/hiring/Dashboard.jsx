import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, jobAPI } from '../../services/api';

export default function HiringDashboard() {
  const { user, profile, organization } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.getHiringTeamDashboard();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  const statCards = [
    { label: 'Total Jobs', value: stats?.totalJobs || 0, icon: '📋', color: 'blue' },
    { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: '✅', color: 'green' },
    { label: 'Total Applications', value: stats?.totalApplications || 0, icon: '📄', color: 'purple' },
    { label: 'Eligible', value: stats?.eligibleApplications || 0, icon: '🎯', color: 'green' },
    { label: 'Rejected', value: stats?.rejectedApplications || 0, icon: '❌', color: 'red' },
    { label: 'Shortlisted', value: stats?.shortlistedApplications || 0, icon: '⭐', color: 'yellow' },
    { label: 'Interview', value: stats?.interviewApplications || 0, icon: '🎤', color: 'blue' },
    { label: 'Needs Review', value: stats?.needsReviewApplications || 0, icon: '🔍', color: 'yellow' },
  ];

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p>{profile?.designation || 'Hiring Team'} at {organization?.companyName || 'Your Company'}</p>
        </div>
        <Link to="/hiring/create-job"><button className="btn btn-primary">+ Post New Job</button></Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active Jobs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Active Job Listings</h3>
          <Link to="/hiring/jobs"><button className="btn btn-ghost btn-sm">View All →</button></Link>
        </div>
        {stats?.activeJobsList?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Job Title</th><th>Location</th><th>Applications</th><th>Eligible</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {stats.activeJobsList.slice(0, 5).map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.title}</td>
                  <td>{job.location || 'Remote'}</td>
                  <td>{job.totalApplications || 0}</td>
                  <td><span className="badge badge-success">{job.eligibleApplications || 0}</span></td>
                  <td><span className="badge badge-info">Active</span></td>
                  <td><Link to={`/hiring/jobs/${job.id}/applicants`}><button className="btn btn-ghost btn-sm">View Applicants</button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Active Jobs</h3>
            <p>Create your first job posting to start receiving applications.</p>
            <Link to="/hiring/create-job"><button className="btn btn-primary" style={{ marginTop: '1rem' }}>Post a Job</button></Link>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Applications</h3>
        </div>
        {stats?.recentApplications?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Applicant</th><th>Status</th><th>Match Score</th><th>AI Risk</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recentApplications.slice(0, 8).map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.applicantProfileId || 'Applicant'}</td>
                  <td><span className={`badge badge-${app.status?.toLowerCase() === 'eligible' ? 'eligible' : app.status?.toLowerCase() === 'rejected' ? 'rejected' : app.status?.toLowerCase() === 'shortlisted' ? 'shortlisted' : 'applied'}`}>{app.status}</span></td>
                  <td>{app.matchScore?.overall ? `${Math.round(app.matchScore.overall)}%` : '—'}</td>
                  <td><span className={`badge badge-${app.resumeContentRisk === 'LOW' ? 'success' : app.resumeContentRisk === 'HIGH' ? 'danger' : 'warning'}`}>{app.resumeContentRisk || 'N/A'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No Applications Yet</h3>
            <p>Applications will appear here once candidates start applying to your jobs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
