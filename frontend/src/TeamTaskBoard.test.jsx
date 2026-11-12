import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const fake = vi.hoisted(() => ({
  items: [],
  create: vi.fn(),
  update: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}),
  doc: () => ({ id: "retry-id" }),
  runTransaction: vi.fn(),
}));
vi.mock("./teamHubData", () => ({
  useTeamFeed: () => ({
    items: fake.items,
    loading: false,
    cached: false,
    error: "",
  }),
}));
vi.mock("./TeamWidgets", () => ({
  MemberName: ({ uid }) => uid,
  FeedStatus: () => null,
}));
vi.mock("./teamTasksData", async (original) => ({
  ...(await original()),
  createTeamTask: fake.create,
  updateTeamTask: fake.update,
  editTeamTask: fake.edit,
  deleteTeamTask: fake.remove,
}));
import { TeamTaskBoard } from "./TeamTaskBoard";
const team = {
  id: "studio",
  ownerId: "alice",
  lifecycle: "active",
  members: ["alice", "bob"],
  roles: { alice: "leader", bob: "member" },
};
const open = (extra = {}) =>
  render(
    <TeamTaskBoard
      team={team}
      user={{ uid: "alice" }}
      act={async (fn) => fn()}
      busy={false}
      {...extra}
    />,
  );
beforeEach(() => {
  vi.clearAllMocks();
  fake.items = [
    {
      id: "task-one",
      title: "Build demo",
      description: "Prototype",
      createdBy: "alice",
      assigneeId: "bob",
      dueDate: "2028-02-29",
      status: "todo",
    },
    {
      id: "task-two",
      title: "Interview students",
      createdBy: "bob",
      assigneeId: "alice",
      dueDate: "",
      status: "done",
    },
  ];
});
afterEach(cleanup);
it("renders actual tasks and calculates progress from loaded records", () => {
  open();
  expect(screen.getByText("Build demo")).toBeInTheDocument();
  expect(
    screen.getByText("1/2 tasks in this view complete"),
  ).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
  fireEvent.click(screen.getByLabelText("Assigned to me"));
  expect(screen.queryByText("Build demo")).toBeNull();
  expect(screen.getByText("Interview students")).toBeInTheDocument();
});
it("creates assigned tasks with a stable retry ID", async () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Add task" }));
  fireEvent.change(screen.getByLabelText("Task title"), {
    target: { value: "Ship prototype" },
  });
  fireEvent.change(screen.getByLabelText("Task assignee"), {
    target: { value: "bob" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create task" }));
  await waitFor(() =>
    expect(fake.create).toHaveBeenCalledWith(
      "studio",
      "alice",
      expect.objectContaining({ title: "Ship prototype", assigneeId: "bob" }),
      "retry-id",
    ),
  );
});
it("updates task status through the persisted workflow", async () => {
  open();
  fireEvent.change(screen.getByLabelText("Status for Build demo"), {
    target: { value: "doing" },
  });
  await waitFor(() =>
    expect(fake.update).toHaveBeenCalledWith("studio", "task-one", "alice", {
      status: "doing",
    }),
  );
});
it("edits task context and keeps archived teams read-only", async () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Edit Build demo" }));
  fireEvent.change(screen.getByLabelText("Task title"), {
    target: { value: "Build accessible demo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save task" }));
  await waitFor(() =>
    expect(fake.edit).toHaveBeenCalledWith(
      "studio",
      "task-one",
      "alice",
      expect.objectContaining({ title: "Build accessible demo" }),
    ),
  );
  cleanup();
  open({ team: { ...team, lifecycle: "archived" } });
  expect(screen.getByRole("button", { name: "Add task" })).toBeDisabled();
  expect(screen.getByLabelText("Status for Build demo")).toBeDisabled();
});
