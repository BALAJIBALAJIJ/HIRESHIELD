import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../../services/api';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobAPI.getMyJobs();
      setJobs(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Jobs</h1><p>View and manage all your job postings</p></div>
        <Link to="/hiring/create-job"><button className="btn btn-primary">+ Post New Job</button></Link>
      </div>

      {jobs.length > 0 ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Job Title</th><th>Location</th><th>Type</th><th>Applications</th><th>Eligible</th><th>Rejected</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 700 }}>{job.title}</td>
                  <td>{job.location || '—'}</td>
                  <td><span className="job-tag">{job.employmentType?.replace('_', '-')}</span></td>
                  <td>{job.totalApplications || 0}</td>
                  <td><span className="badge badge-success">{job.eligibleApplications || 0}</span></td>
                  <td><span className="badge badge-danger">{job.rejectedApplications || 0}</span></td>
                  <td><span className={`badge ${job.active ? 'badge-success' : 'badge-danger'}`}>{job.active ? 'Active' : 'Closed'}</span></td>
                  <td>
                    <Link to={`/hiring/jobs/${job.id}/applicants`}>
                      <button className="btn btn-ghost btn-sm">View Applicants</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Jobs Posted</h3>
            <p>Create your first job posting to start receiving applications from qualified candidates.</p>
            <Link to="/hiring/create-job"><button className="btn btn-primary" style={{ marginTop: '1rem' }}>Post Your First Job</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
