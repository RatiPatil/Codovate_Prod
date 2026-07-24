import api from './axios';

export const applicationsApi = {
  getMetrics: () => api.get('/admin/applications/metrics'),
  getMany: (params) => api.get('/admin/applications', { params }),
  getById: (id) => api.get(`/admin/applications/${id}`),
  create: (data) => api.post('/admin/applications', data),
  advanceStage: (id, stage) => api.patch(`/admin/applications/${id}/stage`, { stage }),
  bulkUpdateStage: (data) => api.patch('/admin/applications/bulk-stage', data),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/applications/export?${queryStr}`;
  }
};
