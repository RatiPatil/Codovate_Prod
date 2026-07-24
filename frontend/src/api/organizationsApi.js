import api from './axios';

export const organizationsApi = {
  // Metrics for dashboard
  getMetrics: () => api.get('/admin/organizations/metrics'),

  // CRUD
  getOrganizations: (params) => api.get('/admin/organizations', { params }), // supports ?limit=50&cursor=xxx&search=xxx
  getOrganizationById: (id) => api.get(`/admin/organizations/${id}`),
  createOrganization: (data) => api.post('/admin/organizations', data),
  updateOrganization: (id, data) => api.put(`/admin/organizations/${id}`, data),
  
  // Lifecycle (Suspend, Restore, Archive)
  changeLifecycle: (id, status) => api.patch(`/admin/organizations/${id}/lifecycle`, { status }),
  
  // Soft delete
  deleteOrganization: (id) => api.delete(`/admin/organizations/${id}`),

  // Export
  exportOrganizations: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/organizations/export?${queryStr}`;
  }
};
