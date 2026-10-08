import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiShieldCheck, HiOutlineUserCircle, HiOutlineBriefcase, HiOutlineHome, HiOutlineLogout, HiOutlineCollection } from 'react-icons/hi';

export default function Navbar() {
  const { isAuthenticated, user, isHiringTeam, isApplicant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="logo-icon">🛡️</div>
        HireShield
      </Link>

      <div className="navbar-links">
        {!isAuthenticated ? (
          <>
            <Link to="/jobs/marketplace">Find Jobs</Link>
            <Link to="/login">Log in</Link>
            <Link to="/register"><button className="btn btn-primary btn-sm">Get Started</button></Link>
          </>
        ) : isHiringTeam ? (
          <>
            <Link to="/hiring/dashboard">Dashboard</Link>
            <Link to="/hiring/jobs">Jobs</Link>
            <Link to="/hiring/create-job">Post Job</Link>
          </>
        ) : (
          <>
            <Link to="/applicant/dashboard">Dashboard</Link>
            <Link to="/jobs/marketplace">Find Jobs</Link>
            <Link to="/applicant/applications">Applications</Link>
          </>
        )}

        {isAuthenticated && (
          <div className="navbar-user">
            <Link to="/profile">
              <div className="navbar-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
