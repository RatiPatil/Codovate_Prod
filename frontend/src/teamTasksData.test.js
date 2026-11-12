import { beforeEach, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_db, ...p) => ({ path: p.join("/") }),
  doc: (_db, ...p) => ({ path: p.join("/"), id: p.at(-1) }),
  serverTimestamp: () => "NOW",
  runTransaction: (_db, fn) => fn(fake),
}));
import {
  taskInput,
  createTeamTask,
  updateTeamTask,
  editTeamTask,
  deleteTeamTask,
} from "./teamTasksData";
const team = {
  ownerId: "alice",
  lifecycle: "active",
  members: ["alice", "bob"],
};
const snapshot = (data) => ({ exists: () => !!data, data: () => data });
beforeEach(() => vi.clearAllMocks());
it("validates assignments, real calendar dates and bounded task content", () => {
  expect(
    taskInput(
      { title: " Demo ", dueDate: "2028-02-29", assigneeId: "bob" },
      team.members,
    ).title,
  ).toBe("Demo");
  expect(() =>
    taskInput({ title: "Demo", dueDate: "2026-02-31" }, team.members),
  ).toThrow(/valid due date/);
  expect(() =>
    taskInput({ title: "Demo", assigneeId: "outsider" }, team.members),
  ).toThrow(/current team member/);
  expect(() => taskInput({ title: "a\nb" }, team.members)).toThrow(
    /short task title/,
  );
});
it("creates a private task and makes retries with the same ID idempotent", async () => {
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(snapshot(null));
  await createTeamTask("studio", "alice", { title: "Build demo" }, "task-one");
  expect(fake.set).toHaveBeenCalledWith(
    expect.objectContaining({ path: "projectTeams/studio/tasks/task-one" }),
    expect.objectContaining({
      status: "todo",
      createdBy: "alice",
      createdAt: "NOW",
    }),
  );
  fake.set.mockClear();
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await createTeamTask("studio", "alice", { title: "Build demo" }, "task-one");
  expect(fake.set).not.toHaveBeenCalled();
});
it("rejects writes to archived teams", async () => {
  fake.get
    .mockResolvedValueOnce(snapshot({ ...team, lifecycle: "archived" }))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await expect(
    updateTeamTask("studio", "task-one", "alice", { status: "done" }),
  ).rejects.toThrow(/read-only/);
});
it("lets members update status without accepting arbitrary patches", async () => {
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await updateTeamTask("studio", "task-one", "bob", { status: "doing" });
  expect(fake.update).toHaveBeenCalledWith(expect.anything(), {
    status: "doing",
    updatedAt: "NOW",
  });
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await expect(
    updateTeamTask("studio", "task-one", "bob", { status: "toString" }),
  ).rejects.toThrow(/valid task status/);
});
it("keeps edit and delete privileges with the creator or leader", async () => {
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await expect(
    editTeamTask("studio", "task-one", "bob", { title: "Changed" }),
  ).rejects.toThrow(/creator or team leader/);
  fake.get
    .mockResolvedValueOnce(snapshot(team))
    .mockResolvedValueOnce(
      snapshot({
        createdBy: "alice",
        title: "Build demo",
        description: "",
        assigneeId: "",
        dueDate: "",
      }),
    );
  await expect(deleteTeamTask("studio", "task-one", "bob")).rejects.toThrow(
    /creator or team leader/,
  );
});
