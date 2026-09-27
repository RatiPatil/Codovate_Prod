import api from './axios';

const generateApiMethods = (basePath) => ({
  getMany: (params) => api.get(`/admin/academic/${basePath}`, { params }),
  getById: (id) => api.get(`/admin/academic/${basePath}/${id}`),
  create: (data) => api.post(`/admin/academic/${basePath}`, data),
  update: (id, data) => api.put(`/admin/academic/${basePath}/${id}`, data),
  changeLifecycle: (id, status) => api.patch(`/admin/academic/${basePath}/${id}/lifecycle`, { status }),
  delete: (id) => api.delete(`/admin/academic/${basePath}/${id}`),
  export: (params) => {
    const queryStr = new URLSearchParams(params).toString();
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/academic/${basePath}/export?${queryStr}`;
  }
});

export const academicApi = {
  getMetrics: () => api.get('/admin/academic/metrics'),
  
  departments: generateApiMethods('departments'),
  programs: generateApiMethods('programs'),
  academicYears: generateApiMethods('academic-years'),
  semesters: generateApiMethods('semesters'),
  divisions: generateApiMethods('divisions'),
  courses: generateApiMethods('courses'),
};
