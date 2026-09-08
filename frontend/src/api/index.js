import { getAuth } from 'firebase/auth';
import {
  get,
  post,
  put,
  del,
} from '../lib/apiClient';

export const dashboardApi = {
  get: () => get('/dashboard'),
};

export const profileApi = {
  get: () => get('/students/me'),
  update: data => put('/students/me', data),
};

export const onboardingApi = {
  get: () => get('/onboarding/me'),
  save: data => post('/onboarding/me', data),
  update: data => put('/onboarding/me', data),
};

export const opportunitiesApi = {
  list: params => get('/opportunities', { params }),
  get: id => get(`/opportunities/${id}`),
};

export const applicationsApi = {
  list: () => get('/applications/my'),
  get: id => get(`/applications/${id}`),
  apply: opportunityId =>
    post(`/applications/${opportunityId}`, {}),
  updateStatus: (id, data) =>
    put(`/applications/${id}/status`, data),
};

export const teamsApi = {
  list: () => get('/teams'),
  create: data => post('/teams', data),
  members: id => get(`/teams/${id}/members`),
  invite: (id, data) =>
    post(`/teams/${id}/invites`, data),
  addMember: (id, data) =>
    post(`/teams/${id}/members`, data),
};

export const projectsApi = {
  list: () => get('/projects'),
  get: id => get(`/projects/${id}`),
  create: data => post('/projects', data),
};

export const networkingApi = {
  connections: () =>
    get('/networking/connections'),
  connect: data =>
    post('/networking/connections', data),
  update: (id, data) =>
    put(`/networking/connections/${id}`, data),
  conversations: () =>
    get('/networking/conversations'),
  messages: id =>
    get(`/networking/conversations/${id}/messages`),
  sendMessage: (id, data) =>
    post(`/networking/conversations/${id}/messages`, data),
};

export const mentorshipApi = {
  mentors: params =>
    get('/mentorship/mentors', { params }),
  mentor: id =>
    get(`/mentorship/mentors/${id}`),
  queries: () =>
    get('/mentorship/queries/my'),
  sessions: () =>
    get('/mentorship/sessions/my'),
  reviews: () =>
    get('/mentorship/reviews/my'),
};

export const learningApi = {
  courses: () =>
    get('/learning/courses'),
  course: id =>
    get(`/learning/courses/${id}`),
  resources: params =>
    get('/learning/resources', { params }),
  progress: () =>
    get('/learning/progress/my'),
  enrollments: () =>
    get('/learning/enrollments/my'),
  enroll: id =>
    post(`/learning/courses/${id}/enroll`, {}),
};

export const careerApi = {
  skills: () =>
    get('/career/skills'),
  mySkills: () =>
    get('/career/skills/my'),
  assessments: () =>
    get('/career/assessments'),
  results: () =>
    get('/career/assessment-results/my'),
  profile: () =>
    get('/career/career-profile'),
  roadmap: () =>
    get('/career/roadmap'),
  roadmapProgress: () =>
    get('/career/roadmap/progress'),
  skillGaps: () =>
    get('/career/skill-gaps'),
};

export const aiApi = {
  context: () =>
    get('/ai/context'),
  recommendations: params =>
    get('/ai/recommendations', { params }),
  dismiss: id =>
    put(`/ai/recommendations/${id}/dismiss`, {}),
  roadmap: () =>
    get('/ai/roadmap'),
  roadmapSteps: () =>
    get('/ai/roadmap/steps'),
  assistantContext: () =>
    get('/ai/assistant/context'),
};

export const showcaseApi = {
  all: () =>
    get('/showcase/showcase'),
  education: () =>
    get('/showcase/education'),
  experience: () =>
    get('/showcase/experience'),
  resumes: () =>
    get('/showcase/resumes'),
  resume: id =>
    get(`/showcase/resumes/${id}`),
  portfolios: () =>
    get('/showcase/portfolios'),
  portfolio: id =>
    get(`/showcase/portfolios/${id}`),
  certificates: () =>
    get('/showcase/certificates'),
  certificate: id =>
    get(`/showcase/certificates/${id}`),
};

export const eventsApi = {
  list: params =>
    get('/events/events', { params }),
  get: id =>
    get(`/events/events/${id}`),
  registrations: () =>
    get('/events/events/registrations/my'),
  register: id =>
    post(`/events/events/${id}/register`, {}),
};

export const engagementApi = {
  notifications: () =>
    get('/engagement/notifications'),
  unreadCount: () =>
    get('/engagement/notifications/unread-count'),
  markRead: id =>
    put(`/engagement/notifications/${id}/read`, {}),
  calendar: () =>
    get('/engagement/calendar'),
  deadlines: () =>
    get('/engagement/deadlines'),
};

export const gamificationApi = {
  summary: () =>
    get('/gamification/summary'),
  goals: () =>
    get('/gamification/goals'),
  badges: () =>
    get('/gamification/badges'),
  achievements: () =>
    get('/gamification/achievements'),
  stats: () =>
    get('/gamification/coding-stats'),
  leaderboard: params =>
    get('/gamification/leaderboard', { params }),
};

export const practiceApi = {
  problems: params =>
    get('/practice/problems', { params }),
  problem: id =>
    get(`/practice/problems/${id}`),
  attempts: () =>
    get('/practice/attempts/my'),
  stats: () =>
    get('/practice/stats/my'),
  summary: () =>
    get('/practice/summary'),
  mockInterviews: () =>
    get('/practice/mock-interviews'),
  mockInterview: id =>
    get(`/practice/mock-interviews/${id}`),
  questions: () =>
    get('/practice/mock-questions'),
};

export const recruiterApi = {
  companies: () =>
    get('/recruiter/companies/my'),
  company: id =>
    get(`/recruiter/companies/${id}`),
  recruiters: () =>
    get('/recruiter/recruiters/my'),
  talent: params =>
    get('/recruiter/talent', { params }),
  jobs: () =>
    get('/recruiter/jobs/my'),
  applications: () =>
    get('/recruiter/applications/my'),
};

export const collegeApi = {
  departments: () =>
    get('/college/departments'),
  faculty: () =>
    get('/college/faculty/my'),
  drives: params =>
    get('/college/placement-drives', { params }),
  drive: id =>
    get(`/college/placement-drives/${id}`),
  driveApplications: id =>
    get(`/college/placement-drives/${id}/applications`),
  placements: () =>
    get('/college/placements/my'),
  dashboard: () =>
    get('/college/placement-dashboard'),
};

export const incubationApi = {
  startups: () =>
    get('/incubation/startups/my'),
  startup: id =>
    get(`/incubation/startups/${id}`),
  applications: () =>
    get('/incubation/applications/my'),
  application: id =>
    get(`/incubation/applications/${id}`),
  programs: () =>
    get('/incubation/programs'),
  milestones: () =>
    get('/incubation/milestones/my'),
};

export const platformApi = {
  search: q =>
    get('/platform/search', { params: { q } }),
  analytics: () =>
    get('/platform/analytics/overview'),
  analyticsMe: () =>
    get('/platform/analytics/me'),
};

export const adminApi = {
  overview: async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Firebase authentication is not ready. Please sign in again.");
    }

    const token = await user.getIdToken(true);

    return api.get("/admin/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Firebase-UID": user.uid,
      },
    });
  },
};

export const realtimeApi = {
  status: () =>
    get('/realtime/status'),
};

export const coreApi = {
  list: (resource, params) =>
    get(`/core/${resource}`, { params }),
  get: (resource, id) =>
    get(`/core/${resource}/${id}`),
  create: (resource, data) =>
    post(`/core/${resource}`, data),
  update: (resource, id, data) =>
    put(`/core/${resource}/${id}`, data),
  remove: (resource, id) =>
    del(`/core/${resource}/${id}`),
};
