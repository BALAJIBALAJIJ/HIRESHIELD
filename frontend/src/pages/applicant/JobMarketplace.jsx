import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../../services/api';

export default function JobMarketplace() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ workMode: '', employmentType: '', experience: '' });

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => { applyFilters(); }, [search, filters, jobs]);

  const loadJobs = async () => {
    try {
      const res = await jobAPI.getMarketplace();
      setJobs(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const applyFilters = () => {
    let result = [...jobs];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(s) ||
        j.description?.toLowerCase().includes(s) ||
        j.requiredSkills?.some(sk => sk.toLowerCase().includes(s)) ||
        j.location?.toLowerCase().includes(s)
      );
    }
    if (filters.workMode) result = result.filter(j => j.workMode === filters.workMode);
    if (filters.employmentType) result = result.filter(j => j.employmentType === filters.employmentType);
    setFiltered(result);
  };

  if (loading) return <div className="main-content"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="main-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Job Marketplace</h1>
        <p>Discover opportunities that match your skills and aspirations</p>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <input className="filter-input" placeholder="🔍 Search by title, skill, or location..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 2 }} />
        <select className="filter-select" value={filters.workMode} onChange={e => setFilters(p => ({ ...p, workMode: e.target.value }))}>
          <option value="">All Modes</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </select>
        <select className="filter-select" value={filters.employmentType} onChange={e => setFilters(p => ({ ...p, employmentType: e.target.value }))}>
          <option value="">All Types</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="CONTRACT">Contract</option>
        </select>
        {(search || filters.workMode || filters.employmentType) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilters({ workMode: '', employmentType: '', experience: '' }); }}>Clear</button>
        )}
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length > 0 ? (
        <div className="jobs-grid">
          {filtered.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none' }}>
              <div className="job-card">
                <div className="job-card-header">
                  <div className="job-card-logo">{job.title?.charAt(0) || 'J'}</div>
                  <div>
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-company">{job.organizationId || 'Company'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>📍 {job.location || 'Remote'}</span>
                  <span>💼 {job.workMode?.replace('_', ' ')}</span>
                  <span>⏱ {job.requiredExperience || 'Any'}</span>
                </div>
                <div className="job-card-tags">
                  {job.requiredSkills?.slice(0, 5).map((s, i) => <span key={i} className="job-tag">{s}</span>)}
                  {job.requiredSkills?.length > 5 && <span className="job-tag">+{job.requiredSkills.length - 5}</span>}
                </div>
                <div className="job-card-footer">
                  <div>
                    <span className="badge badge-info">{job.employmentType?.replace('_', ' ')}</span>
                    {job.salary && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--success-500)', fontWeight: 600 }}>{job.salary}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="job-meta">🎯 {job.numberOfOpenings || 1} opening{job.numberOfOpenings > 1 ? 's' : ''}</span>
                    <button className="btn btn-primary btn-sm">Apply →</button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Jobs Found</h3>
            <p>Try adjusting your search criteria or check back later for new opportunities.</p>
          </div>
        </div>
      )}
    </div>
  );
}
