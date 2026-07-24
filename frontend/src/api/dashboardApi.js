import api from './axios';

export const dashboardApi = {
  getOverviewMetrics: () => api.get('/dashboard/super-admin/metrics/overview'),
  getPlatformHealth: () => api.get('/dashboard/super-admin/metrics/health'),
  getRecentActivity: () => api.get('/dashboard/super-admin/metrics/activity'),
  getGrowthMetrics: () => api.get('/dashboard/super-admin/metrics/growth'),
};
