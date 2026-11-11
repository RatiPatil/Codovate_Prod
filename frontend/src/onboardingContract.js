export const careerGoals = [
  "Internships",
  "Jobs",
  "Hackathons",
  "Project collaboration",
  "Research",
  "Startups",
];
export const studyYears = [
  "First year",
  "Second year",
  "Third year",
  "Fourth year",
  "Final year",
  "Graduated",
  "Other",
];
export const availabilityOptions = [
  "Not sure yet",
  "1-5 hours/week",
  "6-10 hours/week",
  "10+ hours/week",
];
export const collaborationModes = ["Remote", "On-site", "Hybrid"];
export const needsOnboarding = (profile) =>
  profile?.onboarding?.status === "in-progress";
export const initialOnboarding = (startedAt) => ({
  version: 1,
  status: "in-progress",
  step: 1,
  startedAt,
  completedAt: null,
});
export const emptyCareerPreferences = {
  desiredRole: "",
  domain: "",
  experience: "Beginner",
  goals: [],
  seeking: [],
  availability: "Not sure yet",
  mode: "Remote",
  yearOfStudy: "",
  justStarting: false,
};
