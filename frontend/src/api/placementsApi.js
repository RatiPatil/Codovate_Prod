import api from './axios';

const generateApiMethods = (basePath) => ({
  getMany: (params) => api.get(`/admin/placements/${basePath}`, { params }),
  getById: (id) => api.get(`/admin/placements/${basePath}/${id}`),
  create: (data) => api.post(`/admin/placements/${basePath}`, data),
  update: (id, data) => api.put(`/admin/placements/${basePath}/${id}`, data),
  changeLifecycle: (id, status) => api.patch(`/admin/placements/${basePath}/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/placements/${basePath}/${id}`),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/placements/${basePath}-export?${queryStr}`;
  }
});

export const placementsApi = {
  getMetrics: () => api.get('/admin/placements/metrics'),
  staff: generateApiMethods('staff'),
  drives: generateApiMethods('drives')
};
