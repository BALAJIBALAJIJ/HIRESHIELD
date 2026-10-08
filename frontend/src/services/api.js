import axios from 'axios';
import { installDemoMode } from './demoMode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Install demo mode — all API calls handled client-side
installDemoMode(api);

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// === Auth APIs ===
export const authAPI = {
  registerHiringTeam: (data) => api.post('/auth/register/hiring-team', data),
  registerApplicant: (data) => api.post('/auth/register/applicant', data),
  login: (data) => api.post('/auth/login', data),
};

// === Profile APIs ===
export const profileAPI = {
  getMyProfile: () => api.get('/profile/me'),
  updateApplicantProfile: (data) => api.put('/profile/applicant', data),
  updateHiringTeamProfile: (data) => api.put('/profile/hiring-team', data),
  updateOrganization: (data) => api.put('/profile/organization', data),
  uploadPhoto: (formData) => api.post('/profile/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadResume: (formData) => api.post('/profile/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadLogo: (formData) => api.post('/profile/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// === Job APIs ===
export const jobAPI = {
  getMarketplace: () => api.get('/jobs/marketplace'),
  getJobById: (id) => api.get(`/jobs/public/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getScreeningQuestions: (jobId) => api.get(`/jobs/${jobId}/screening-questions`),
};

// === Application APIs ===
export const applicationAPI = {
  apply: (formData) => api.post('/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyApplications: () => api.get('/applications/my-applications'),
  getApplication: (id) => api.get(`/applications/${id}`),
  getApplicationsByJob: (jobId, status) =>
    api.get(`/applications/job/${jobId}${status ? `?status=${status}` : ''}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  addNote: (id, data) => api.post(`/applications/${id}/notes`, data),
  submitAnswers: (id, data) => api.post(`/applications/${id}/screening-answers`, data),
  getScreeningAnswers: (id) => api.get(`/applications/${id}/screening-answers`),
  getScreeningResult: (id) => api.get(`/applications/${id}/screening-result`),
};

// === Dashboard APIs ===
export const dashboardAPI = {
  getHiringTeamDashboard: () => api.get('/dashboard/hiring-team'),
  getApplicantDashboard: () => api.get('/dashboard/applicant'),
};

export default api;
