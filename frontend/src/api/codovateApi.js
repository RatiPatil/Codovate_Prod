import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from './postgresApi';

export const dashboardApi = {
  get: () => apiGet('/dashboard'),
};

export const profileApi = {
  get: () => apiGet('/students/me'),
  update: data => apiPut('/students/me', data),
};

export const onboardingApi = {
  get: () => apiGet('/onboarding/me'),
  save: data => apiPost('/onboarding/me', data),
  update: data => apiPut('/onboarding/me', data),
};

export const opportunitiesApi = {
  list: params => apiGet('/opportunities', params),
  get: id => apiGet(`/opportunities/${id}`),
};

export const applicationsApi = {
  mine: () => apiGet('/applications/my'),
  get: id => apiGet(`/applications/${id}`),
  apply: opportunityId =>
    apiPost(`/applications/${opportunityId}`, {}),
  status: (id, data) =>
    apiPut(`/applications/${id}/status`, data),
};

export const teamsApi = {
  list: () => apiGet('/teams'),
  create: data => apiPost('/teams', data),
  members: id => apiGet(`/teams/${id}/members`),
  invite: (id, data) => apiPost(`/teams/${id}/invites`, data),
  addMember: (id, data) => apiPost(`/teams/${id}/members`, data),
};

export const projectsApi = {
  list: () => apiGet('/projects'),
  create: data => apiPost('/projects', data),
  get: id => apiGet(`/projects/${id}`),
};

export const networkingApi = {
  connections: () => apiGet('/networking/connections'),
  connect: data => apiPost('/networking/connections', data),
  updateConnection: (id, data) =>
    apiPut(`/networking/connections/${id}`, data),
  conversations: () =>
    apiGet('/networking/conversations'),
  messages: id =>
    apiGet(`/networking/conversations/${id}/messages`),
  sendMessage: (id, data) =>
    apiPost(`/networking/conversations/${id}/messages`, data),
};

export const mentorshipApi = {
  mentors: params => apiGet('/mentorship/mentors', params),
  mentor: id => apiGet(`/mentorship/mentors/${id}`),
  queries: () => apiGet('/mentorship/queries/my'),
  sessions: () => apiGet('/mentorship/sessions/my'),
  reviews: () => apiGet('/mentorship/reviews/my'),
};

export const learningApi = {
  courses: () => apiGet('/learning/courses'),
  course: id => apiGet(`/learning/courses/${id}`),
  resources: params => apiGet('/learning/resources', params),
  progress: () => apiGet('/learning/progress/my'),
  enrollments: () =>
    apiGet('/learning/enrollments/my'),
  enroll: id =>
    apiPost(`/learning/courses/${id}/enroll`, {}),
};

export const careerApi = {
  skills: () => apiGet('/career/skills'),
  mySkills: () => apiGet('/career/skills/my'),
  assessments: () => apiGet('/career/assessments'),
  results: () =>
    apiGet('/career/assessment-results/my'),
  careerProfile: () =>
    apiGet('/career/career-profile'),
  roadmap: () =>
    apiGet('/career/roadmap'),
  roadmapProgress: () =>
    apiGet('/career/roadmap/progress'),
  skillGaps: () =>
    apiGet('/career/skill-gaps'),
};

export const aiApi = {
  context: () => apiGet('/ai/context'),
  recommendations: params =>
    apiGet('/ai/recommendations', params),
  dismissRecommendation: id =>
    apiPut(`/ai/recommendations/${id}/dismiss`, {}),
  roadmap: () => apiGet('/ai/roadmap'),
  roadmapSteps: () =>
    apiGet('/ai/roadmap/steps'),
  assistantContext: () =>
    apiGet('/ai/assistant/context'),
};

export const showcaseApi = {
  all: () => apiGet('/showcase/showcase'),
  education: () => apiGet('/showcase/education'),
  experience: () => apiGet('/showcase/experience'),
  resumes: () => apiGet('/showcase/resumes'),
  resume: id => apiGet(`/showcase/resumes/${id}`),
  portfolios: () => apiGet('/showcase/portfolios'),
  portfolio: id =>
    apiGet(`/showcase/portfolios/${id}`),
  certificates: () =>
    apiGet('/showcase/certificates'),
  certificate: id =>
    apiGet(`/showcase/certificates/${id}`),
};

export const eventsApi = {
  list: params => apiGet('/events/events', params),
  get: id => apiGet(`/events/events/${id}`),
  registrations: () =>
    apiGet('/events/events/registrations/my'),
  register: id =>
    apiPost(`/events/events/${id}/register`, {}),
};

export const engagementApi = {
  notifications: () =>
    apiGet('/engagement/notifications'),
  unreadCount: () =>
    apiGet('/engagement/notifications/unread-count'),
  markRead: id =>
    apiPut(`/engagement/notifications/${id}/read`, {}),
  calendar: () =>
    apiGet('/engagement/calendar'),
  deadlines: () =>
    apiGet('/engagement/deadlines'),
};

export const gamificationApi = {
  summary: () =>
    apiGet('/gamification/summary'),
  goals: () =>
    apiGet('/gamification/goals'),
  badges: () =>
    apiGet('/gamification/badges'),
  achievements: () =>
    apiGet('/gamification/achievements'),
  stats: () =>
    apiGet('/gamification/coding-stats'),
  leaderboard: params =>
    apiGet('/gamification/leaderboard', params),
};

export const practiceApi = {
  problems: params =>
    apiGet('/practice/problems', params),
  problem: id =>
    apiGet(`/practice/problems/${id}`),
  attempts: () =>
    apiGet('/practice/attempts/my'),
  stats: () =>
    apiGet('/practice/stats/my'),
  summary: () =>
    apiGet('/practice/summary'),
  mockInterviews: () =>
    apiGet('/practice/mock-interviews'),
  mockInterview: id =>
    apiGet(`/practice/mock-interviews/${id}`),
  questions: () =>
    apiGet('/practice/mock-questions'),
};

export const recruiterApi = {
  companies: () => apiGet('/recruiter/companies/my'),
  company: id => apiGet(`/recruiter/companies/${id}`),
  recruiters: () => apiGet('/recruiter/recruiters/my'),
  talent: params => apiGet('/recruiter/talent', params),
  jobs: () => apiGet('/recruiter/jobs/my'),
  applications: () =>
    apiGet('/recruiter/applications/my'),
};

export const collegeApi = {
  departments: () =>
    apiGet('/college/departments'),
  faculty: () =>
    apiGet('/college/faculty/my'),
  drives: params =>
    apiGet('/college/placement-drives', params),
  drive: id =>
    apiGet(`/college/placement-drives/${id}`),
  driveApplications: id =>
    apiGet(`/college/placement-drives/${id}/applications`),
  placements: () =>
    apiGet('/college/placements/my'),
  dashboard: () =>
    apiGet('/college/placement-dashboard'),
};

export const incubationApi = {
  startups: () =>
    apiGet('/incubation/startups/my'),
  startup: id =>
    apiGet(`/incubation/startups/${id}`),
  applications: () =>
    apiGet('/incubation/applications/my'),
  application: id =>
    apiGet(`/incubation/applications/${id}`),
  programs: () =>
    apiGet('/incubation/programs'),
  milestones: () =>
    apiGet('/incubation/milestones/my'),
};

export const platformApi = {
  search: q => apiGet('/platform/search', { q }),
  analytics: () =>
    apiGet('/platform/analytics/overview'),
  analyticsMe: () =>
    apiGet('/platform/analytics/me'),
};

export const realtimeApi = {
  status: () => apiGet('/realtime/status'),
};

export const coreApi = {
  list: (resource, params) =>
    apiGet(`/core/${resource}`, params),
  get: (resource, id) =>
    apiGet(`/core/${resource}/${id}`),
  create: (resource, data) =>
    apiPost(`/core/${resource}`, data),
  update: (resource, id, data) =>
    apiPut(`/core/${resource}/${id}`, data),
  remove: (resource, id) =>
    apiDelete(`/core/${resource}/${id}`),
};

export default {
  dashboardApi,
  profileApi,
  onboardingApi,
  opportunitiesApi,
  applicationsApi,
  teamsApi,
  projectsApi,
  networkingApi,
  mentorshipApi,
  learningApi,
  careerApi,
  aiApi,
  showcaseApi,
  eventsApi,
  engagementApi,
  gamificationApi,
  practiceApi,
  recruiterApi,
  collegeApi,
  incubationApi,
  platformApi,
  realtimeApi,
  coreApi,
};
