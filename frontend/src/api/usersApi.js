import api from './axios';

export const usersApi = {
  // Metrics for dashboard
  getMetrics: () => api.get('/admin/users/metrics'),

  // CRUD
  getUsers: (params) => api.get('/admin/users', { params }), // supports ?limit=50&cursor=xxx&search=xxx
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  
  // Lifecycle (Suspend, Restore, Lock, Disable)
  changeLifecycle: (id, status) => api.patch(`/admin/users/${id}/lifecycle`, { status }),
  
  // Soft delete
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Export
  exportUsers: (params) => {
    // Generate a direct download link since Axios blob handling can be messy for large files
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/export?${queryStr}`;
  }
};
