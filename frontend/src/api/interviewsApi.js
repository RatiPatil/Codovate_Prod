import api from './axios';

export const interviewsApi = {
  getMetrics: () => api.get('/admin/interviews/metrics'),
  getMany: (params) => api.get('/admin/interviews', { params }),
  getById: (id) => api.get(`/admin/interviews/${id}`),
  create: (data) => api.post('/admin/interviews', data),
  update: (id, data) => api.put(`/admin/interviews/${id}`, data),
  changeStatus: (id, status) => api.patch(`/admin/interviews/${id}/status`, { status }),
  submitFeedback: (id, data) => api.patch(`/admin/interviews/${id}/feedback`, data),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/interviews/export?${queryStr}`;
  }
};
