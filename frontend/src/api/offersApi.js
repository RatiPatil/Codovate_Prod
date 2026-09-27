import api from './axios';

export const offersApi = {
  getMetrics: () => api.get('/admin/offers/metrics'),
  getMany: (params) => api.get('/admin/offers', { params }),
  getById: (id) => api.get(`/admin/offers/${id}`),
  create: (data) => api.post('/admin/offers', data),
  update: (id, data) => api.put(`/admin/offers/${id}`, data),
  changeStatus: (id, status) => api.patch(`/admin/offers/${id}/status`, { status }),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/offers/export?${queryStr}`;
  }
};
