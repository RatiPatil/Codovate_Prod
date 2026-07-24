import api from './axios';

const generateApiMethods = (basePath) => ({
  getMetrics: () => api.get(`/admin/${basePath}/metrics`),
  getMany: (params) => api.get(`/admin/${basePath}`, { params }),
  getById: (id) => api.get(`/admin/${basePath}/${id}`),
  create: (data) => api.post(`/admin/${basePath}`, data),
  update: (id, data) => api.put(`/admin/${basePath}/${id}`, data),
  changeLifecycle: (id, status) => api.patch(`/admin/${basePath}/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/${basePath}/${id}`),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/${basePath}/export?${queryStr}`;
  }
});

export const staffApi = {
  faculty: generateApiMethods('faculty'),
  mentors: generateApiMethods('mentors')
};
