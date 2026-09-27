import api from './axios';

export const collegesApi = {
  // Metrics for dashboard
  getMetrics: () => api.get('/admin/colleges/metrics'),

  // CRUD
  getColleges: (params) => api.get('/admin/colleges', { params }), // supports ?limit=50&cursor=xxx&search=xxx
  getCollegeById: (id) => api.get(`/admin/colleges/${id}`),
  createCollege: (data) => api.post('/admin/colleges', data),
  updateCollege: (id, data) => api.put(`/admin/colleges/${id}`, data),
  
  // Lifecycle (Suspend, Restore, Archive)
  changeLifecycle: (id, status) => api.patch(`/admin/colleges/${id}/lifecycle`, { status }),
  
  // Soft delete
  deleteCollege: (id) => api.delete(`/admin/colleges/${id}`),

  // Export
  exportColleges: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/colleges/export?${queryStr}`;
  }
};
