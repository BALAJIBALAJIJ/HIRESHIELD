import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import HiringDashboard from './pages/hiring/Dashboard';
import CreateJob from './pages/hiring/CreateJob';
import ManageJobs from './pages/hiring/ManageJobs';
import ApplicantManagement from './pages/hiring/ApplicantManagement';
import ApplicantDashboard from './pages/applicant/Dashboard';
import JobMarketplace from './pages/applicant/JobMarketplace';
import JobDetails from './pages/applicant/JobDetails';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationDetails from './pages/ApplicationDetails';
import Profile from './pages/Profile';
import './index.css';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, isHiringTeam, isApplicant } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={isAuthenticated ? (isHiringTeam ? <Navigate to="/hiring/dashboard" /> : <Navigate to="/applicant/dashboard" />) : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/jobs/marketplace" element={<><Navbar /><JobMarketplace /></>} />
      <Route path="/jobs/:jobId" element={<><Navbar /><JobDetails /></>} />

      {/* Hiring Team */}
      <Route path="/hiring/dashboard" element={<ProtectedRoute requiredRole="HIRING_TEAM"><Navbar /><div className="app-layout"><HiringDashboard /></div></ProtectedRoute>} />
      <Route path="/hiring/create-job" element={<ProtectedRoute requiredRole="HIRING_TEAM"><Navbar /><div className="app-layout"><CreateJob /></div></ProtectedRoute>} />
      <Route path="/hiring/jobs" element={<ProtectedRoute requiredRole="HIRING_TEAM"><Navbar /><div className="app-layout"><ManageJobs /></div></ProtectedRoute>} />
      <Route path="/hiring/jobs/:jobId/applicants" element={<ProtectedRoute requiredRole="HIRING_TEAM"><Navbar /><div className="app-layout"><ApplicantManagement /></div></ProtectedRoute>} />

      {/* Applicant */}
      <Route path="/applicant/dashboard" element={<ProtectedRoute requiredRole="APPLICANT"><Navbar /><div className="app-layout"><ApplicantDashboard /></div></ProtectedRoute>} />
      <Route path="/applicant/applications" element={<ProtectedRoute requiredRole="APPLICANT"><Navbar /><div className="app-layout"><MyApplications /></div></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/profile" element={<ProtectedRoute><Navbar /><div className="app-layout"><Profile /></div></ProtectedRoute>} />
      <Route path="/applications/:applicationId" element={<ProtectedRoute><Navbar /><div className="app-layout"><ApplicationDetails /></div></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
