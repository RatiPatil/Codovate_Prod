import api from './axios';

export const jobsApi = {
  getMetrics: () => api.get('/admin/jobs/metrics'),
  getMany: (params) => api.get('/admin/jobs', { params }),
  getById: (id) => api.get(`/admin/jobs/${id}`),
  create: (data) => api.post('/admin/jobs', data),
  update: (id, data) => api.put(`/admin/jobs/${id}`, data),
  publish: (id) => api.patch(`/admin/jobs/${id}/publish`),
  close: (id) => api.patch(`/admin/jobs/${id}/close`),
  changeLifecycle: (id, status) => api.patch(`/admin/jobs/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/jobs/${id}`),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/jobs/export?${queryStr}`;
  }
};
