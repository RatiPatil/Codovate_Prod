import api from './axios';

export const companiesApi = {
  getMetrics: () => api.get('/admin/companies/metrics'),
  getMany: (params) => api.get('/admin/companies', { params }),
  getById: (id) => api.get(`/admin/companies/${id}`),
  create: (data) => api.post('/admin/companies', data),
  update: (id, data) => api.put(`/admin/companies/${id}`, data),
  changeLifecycle: (id, status) => api.patch(`/admin/companies/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/companies/${id}`),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/companies/export?${queryStr}`;
  }
};
