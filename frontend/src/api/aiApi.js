import api from './axios';

export const aiApi = {
  getDashboard: () => api.get('/student/ai/dashboard'),
  getJobs: () => api.get('/student/ai/jobs'),
  getMentors: () => api.get('/student/ai/mentors'),
};
