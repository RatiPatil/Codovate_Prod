import api from './axios';

export const studentsApi = {
  // Metrics for dashboard
  getMetrics: () => api.get('/admin/students/metrics'),

  // CRUD
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentById: (id) => api.get(`/admin/students/${id}`),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  
  // Lifecycle
  changeLifecycle: (id, status) => api.patch(`/admin/students/${id}/lifecycle`, { status }),
  
  // Soft delete
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  // Export
  exportStudents: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/students/export?${queryStr}`;
  }
};
