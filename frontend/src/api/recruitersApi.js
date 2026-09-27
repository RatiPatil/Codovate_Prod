import api from './axios';

const generateApiMethods = (basePath) => ({
  getMany: (params) => api.get(`/admin/recruiters${basePath}`, { params }),
  getById: (id) => api.get(`/admin/recruiters${basePath}/${id}`),
  create: (data) => api.post(`/admin/recruiters${basePath}`, data),
  update: (id, data) => api.put(`/admin/recruiters${basePath}/${id}`, data),
  changeLifecycle: (id, status) => api.patch(`/admin/recruiters${basePath}/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/recruiters${basePath}/${id}`),
});

export const recruitersApi = {
  getMetrics: () => api.get('/admin/recruiters/metrics'),
  profiles: {
    ...generateApiMethods(''),
    export: (params) => {
      const queryStr = new URLSearchParams(params).toString();
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/recruiters/export?${queryStr}`;
    }
  },
  teams: generateApiMethods('/teams')
};
