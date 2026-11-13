import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  run: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_, collection, id) => `${collection}/${id}`,
  runTransaction: (_, fn) => mock.run(fn),
  serverTimestamp: () => "server-time",
}));
import {
  preparationInput,
  actionPlanInput,
  reflectionInput,
  saveMentoringWorkspace,
} from "./mentoringWorkspaceData";
const snap = (data) => ({ exists: () => !!data, data: () => data });
const old = {
  bookingId: "a_m",
  studentId: "a",
  preparation: { goal: "Architecture", context: "", artifactUrl: "" },
  plan: { summary: "Simplify", actions: ["Draw a diagram", "Add tests"] },
  completedActions: [],
  rating: 0,
  reflection: "",
  createdAt: "original",
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.run.mockImplementation((fn) => fn(mock));
  mock.get.mockImplementation(async (ref) =>
    ref.startsWith("mentorBookings")
      ? snap({ studentId: "a", status: "confirmed" })
      : snap(old),
  );
});
it("validates preparation, rejects unsafe links and bounds every field", () => {
  expect(
    preparationInput({
      goal: "  Review design ",
      artifactUrl: "https://github.com/a/b",
    }).goal,
  ).toBe("Review design");
  expect(() => preparationInput({ goal: "" })).toThrow();
  expect(() =>
    preparationInput({ goal: "x", artifactUrl: "javascript:alert(1)" }),
  ).toThrow();
  expect(() =>
    preparationInput({
      goal: "x",
      artifactUrl: "https://user:pass@example.com",
    }),
  ).toThrow();
  expect(() =>
    preparationInput({ goal: "x", context: "x".repeat(1501) }),
  ).toThrow();
});
it("requires concrete, distinct next steps and complete feedback", () => {
  expect(
    actionPlanInput({
      summary: "Advice",
      action1: "Revise diagram",
      action3: "Deploy",
    }).actions,
  ).toEqual(["Revise diagram", "Deploy"]);
  expect(() => actionPlanInput({ summary: "Advice" })).toThrow();
  expect(() =>
    actionPlanInput({ summary: "Advice", action1: "Same", action2: "Same" }),
  ).toThrow();
  expect(() => reflectionInput({ rating: 0, reflection: "Great" })).toThrow();
  expect(() => reflectionInput({ rating: 5, reflection: "" })).toThrow();
});
it("preserves preparation and resets progress when a plan is replaced", async () => {
  await saveMentoringWorkspace("a_m", "plan", {
    summary: "New advice",
    action1: "Refactor",
  });
  expect(mock.update).toHaveBeenCalledWith("mentorWorkspaces/a_m", {
    updatedAt: "server-time",
    plan: { summary: "New advice", actions: ["Refactor"] },
    completedActions: [],
  });
  expect(mock.set).not.toHaveBeenCalled();
});
it("merges progress transactionally and rejects a stale replacement step", async () => {
  await saveMentoringWorkspace("a_m", "progress", {
    index: 1,
    action: "Add tests",
    checked: true,
  });
  expect(mock.update.mock.calls[0][1].completedActions).toEqual([1]);
  await expect(
    saveMentoringWorkspace("a_m", "progress", {
      index: 1,
      action: "Old task",
      checked: true,
    }),
  ).rejects.toThrow("plan has changed");
});
it("creates one workspace per booking with no copied mobile or email", async () => {
  mock.get.mockImplementation(async (ref) =>
    ref.startsWith("mentorBookings")
      ? snap({ studentId: "a", status: "pending" })
      : snap(null),
  );
  await saveMentoringWorkspace("a_m", "preparation", {
    goal: "Review project",
  });
  expect(mock.set.mock.calls[0][0]).toBe("mentorWorkspaces/a_m");
  expect(mock.set.mock.calls[0][1]).toMatchObject({
    studentId: "a",
    bookingId: "a_m",
    createdAt: "server-time",
    preparation: { goal: "Review project" },
  });
  expect(mock.set.mock.calls[0][1]).not.toHaveProperty("email");
});
it("rejects reflection before completion and writes to closed bookings", async () => {
  await expect(
    saveMentoringWorkspace("a_m", "feedback", {
      rating: 5,
      reflection: "Build",
    }),
  ).rejects.toThrow("marked completed");
  mock.get.mockImplementation(async (ref) =>
    ref.startsWith("mentorBookings")
      ? snap({ studentId: "a", status: "cancelled" })
      : snap(old),
  );
  await expect(
    saveMentoringWorkspace("a_m", "preparation", { goal: "New" }),
  ).rejects.toThrow("read-only");
  expect(mock.update).not.toHaveBeenCalled();
});
