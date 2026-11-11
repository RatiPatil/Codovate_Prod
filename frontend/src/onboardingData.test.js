import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  docs: {},
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {}, auth: {}, configured: true }));
vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal()),
  doc: (_db, collection, uid) => ({ collection, uid }),
  serverTimestamp: () => "server-time",
  runTransaction: async (_db, callback) =>
    callback({
      get: async (ref) => ({
        exists: () => !!state.docs[ref.collection],
        data: () => state.docs[ref.collection],
      }),
      update: state.update,
      set: state.set,
      delete: state.delete,
    }),
}));
import { initialOnboarding, needsOnboarding } from "./onboardingContract";
import {
  onboardingDraft,
  onboardingInput,
  saveOnboarding,
} from "./onboardingData";
const user = {
  uid: "student",
  email: "private@example.com",
  displayName: "vivek chavan",
};
const draft = () => ({
  ...onboardingDraft(null, user),
  college: "Regional College",
  city: "Pune",
  program: "Computer Science",
  bio: "I enjoy building accessible web applications.",
  degree: "MCA",
  graduationYear: "2027",
  skillsText: "React, React, Design",
  preferences: {
    ...onboardingDraft(null, user).preferences,
    yearOfStudy: "Final year",
    desiredRole: "Frontend Developer",
    domain: "Web Development",
    goals: ["Internships"],
    seeking: ["Project Collaborators"],
  },
});
beforeEach(() => {
  vi.clearAllMocks();
  state.docs = {
    users: {
      name: "VIVEK CHAVAN",
      email: user.email,
      createdAt: "created",
      resumePath: "",
      onboarding: initialOnboarding("created"),
    },
  };
});
it("marks only explicitly new or unfinished profiles for onboarding", () => {
  expect(needsOnboarding(null)).toBe(false);
  expect(needsOnboarding({ name: "Legacy Student" })).toBe(false);
  expect(needsOnboarding({ onboarding: initialOnboarding("created") })).toBe(
    true,
  );
  expect(needsOnboarding({ onboarding: { status: "completed" } })).toBe(false);
});
it("normalizes full names, validates progress, and supports beginners", () => {
  expect(onboardingInput(draft(), 4, true).name).toBe("VIVEK CHAVAN");
  expect(onboardingInput(draft(), 4, true).skills).toEqual(["React", "Design"]);
  expect(() => onboardingInput({ ...draft(), name: "Vivek" }, 1)).toThrow(
    "full name",
  );
  expect(() => onboardingInput({ ...draft(), college: "" }, 2)).toThrow(
    "college",
  );
  expect(() => onboardingInput({ ...draft(), skillsText: "" }, 3)).toThrow(
    "skills",
  );
  expect(
    onboardingInput(
      {
        ...draft(),
        skillsText: "",
        preferences: { ...draft().preferences, justStarting: true },
      },
      4,
      true,
    ).skills,
  ).toEqual([]);
  expect(() =>
    onboardingInput({ ...draft(), portfolio: "javascript:alert(1)" }, 3),
  ).toThrow("HTTPS");
});
it("saves the next step without rewriting account identity or incrementing community counts", async () => {
  await saveOnboarding(user, draft(), 1);
  expect(state.update.mock.calls[0][1]).toMatchObject({
    name: "VIVEK CHAVAN",
    onboarding: {
      step: 2,
      status: "in-progress",
      startedAt: "created",
      completedAt: null,
    },
  });
  expect(state.update.mock.calls[0][1]).not.toHaveProperty("email");
  expect(state.update.mock.calls[0][1]).not.toHaveProperty("createdAt");
  expect(
    state.set.mock.calls.some(([ref]) => ref.collection === "publicStats"),
  ).toBe(false);
});
it("completes atomically, saves private team preferences, and shares only approved name and skills", async () => {
  await saveOnboarding(user, draft(), 4, {
    complete: true,
    discoverable: true,
  });
  expect(state.update.mock.calls[0][1].onboarding).toMatchObject({
    status: "completed",
    step: 4,
    completedAt: "server-time",
  });
  const preference = state.set.mock.calls.find(
    ([ref]) => ref.collection === "discoveryPreferences",
  )[1];
  expect(preference).toMatchObject({
    uid: user.uid,
    shareDetails: false,
    details: {
      desiredRole: "Frontend Developer",
      seeking: ["Project Collaborators"],
    },
  });
  const publicProfile = state.set.mock.calls.find(
    ([ref]) => ref.collection === "memberProfiles",
  )[1];
  expect(Object.keys(publicProfile).sort()).toEqual([
    "name",
    "skills",
    "uid",
    "updatedAt",
  ]);
  expect(publicProfile.name).toBe("VIVEK CHAVAN");
});
it("never publishes discovery by default and never resets completed or legacy accounts", async () => {
  await saveOnboarding(user, draft(), 4, { complete: true });
  expect(
    state.set.mock.calls.some(([ref]) => ref.collection === "memberProfiles"),
  ).toBe(false);
  for (const profile of [
    { name: "Existing Student", createdAt: "created" },
    { onboarding: { status: "completed" } },
  ]) {
    vi.clearAllMocks();
    state.docs.users = profile;
    await saveOnboarding(user, draft(), 4, { complete: true });
    expect(state.update).not.toHaveBeenCalled();
    expect(state.set).not.toHaveBeenCalled();
  }
});
it("can save an unfinished first step and resume without pretending setup is complete", async () => {
  await saveOnboarding(user, { ...onboardingDraft(null, user), name: "v" }, 1, {
    partial: true,
  });
  expect(state.update.mock.calls[0][1]).toMatchObject({
    name: "V",
    onboarding: { step: 1, status: "in-progress" },
  });
});

it("requires city, specialization, introduction and teammate interests before finishing", () => {
  for (const [key, step] of [
    ["city", 1],
    ["program", 2],
    ["bio", 3],
  ]) {
    expect(() => onboardingInput({ ...draft(), [key]: "" }, step)).toThrow();
  }
  expect(() =>
    onboardingInput(
      { ...draft(), preferences: { ...draft().preferences, seeking: [] } },
      4,
      true,
    ),
  ).toThrow("teammate");
});
