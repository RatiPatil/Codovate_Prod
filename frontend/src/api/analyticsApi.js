import api from './axios';

export const analyticsApi = {
  getSuperAdminAnalytics: () => api.get('/analytics/super-admin'),
  getCollegeAnalytics: () => api.get('/analytics/college'),
  getCompanyAnalytics: () => api.get('/analytics/company'),
};
