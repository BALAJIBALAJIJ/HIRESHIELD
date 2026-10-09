import { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.getMyProfile();
      const data = res.data.data;
      setProfile(data.profile || null);
      setOrganization(data.organization || null);
      if (data.user) {
        const userData = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...data.user };
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    const jwtToken = token || userData?.token;
    if (jwtToken) {
      localStorage.setItem('token', jwtToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    loadProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setOrganization(null);
  };

  const isHiringTeam = user?.role === 'HIRING_TEAM';
  const isApplicant = user?.role === 'APPLICANT';

  return (
    <AuthContext.Provider value={{
      user, profile, organization, loading,
      login, logout, loadProfile,
      isHiringTeam, isApplicant, isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
