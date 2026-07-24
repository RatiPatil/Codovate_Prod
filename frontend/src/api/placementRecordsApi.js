import api from './axios';

export const placementRecordsApi = {
  getMetrics: () => api.get('/admin/placement-records/metrics'),
  getMany: (params) => api.get('/admin/placement-records', { params }),
  getById: (id) => api.get(`/admin/placement-records/${id}`),
  create: (data) => api.post('/admin/placement-records', data),
  update: (id, data) => api.put(`/admin/placement-records/${id}`, data),
  changeStatus: (id, status) => api.patch(`/admin/placement-records/${id}/status`, { status }),
  promoteToAlumni: (data) => api.post(`/admin/placement-records/alumni`, data),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/placement-records/export?${queryStr}`;
  }
};
