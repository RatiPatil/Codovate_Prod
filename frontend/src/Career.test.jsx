import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({
  items: [],
  create: vi.fn(),
  change: vi.fn(),
  remove: vi.fn(),
  save: vi.fn(),
  removeResource: vi.fn(),
  refresh: vi.fn(),
  loadMore: vi.fn(),
}));
vi.mock("./session", () => ({
  useSession: () => ({ user: { uid: "alice" } }),
}));
vi.mock("./firebase", () => ({ configured: true }));
vi.mock("./careerData", () => ({
  resourceCategories: [
    "Interview prep",
    "Resume & portfolio",
    "Technical skills",
    "Career guidance",
  ],
  useCareerPage: () => ({
    items: state.items,
    loading: false,
    error: null,
    more: true,
    refresh: state.refresh,
    loadMore: state.loadMore,
  }),
  createTask: state.create,
  changeTask: state.change,
  removeTask: state.remove,
  saveResource: state.save,
  removeResource: state.removeResource,
}));
import { CareerPlanner, ResourceLibrary, StudentDirectory } from "./Career";
beforeEach(() => {
  state.items = [];
  Object.values(state).forEach((v) => {
    if (typeof v?.mockReset === "function") v.mockReset();
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function open(component) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}
describe("career workflows", () => {
  it("creates a task using the authenticated owner and refreshes only on success", async () => {
    state.create.mockResolvedValue({ id: "new" });
    open(<CareerPlanner />);
    fireEvent.change(screen.getByLabelText("What will you work on?"), {
      target: { value: "Prepare resume" },
    });
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2027-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to my plan" }));
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith("alice", {
        title: "Prepare resume",
        dueDate: "2027-01-01",
        note: "",
      }),
    );
    expect(
      await screen.findByText("Task added to your plan."),
    ).toBeInTheDocument();
    expect(state.refresh).toHaveBeenCalledOnce();
  });
  it("surfaces write failure and preserves form input", async () => {
    state.create.mockRejectedValue({ code: "permission-denied" });
    open(<CareerPlanner />);
    fireEvent.change(screen.getByLabelText("What will you work on?"), {
      target: { value: "My goal" },
    });
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2027-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to my plan" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(state.refresh).not.toHaveBeenCalled();
    expect(screen.getByLabelText("What will you work on?")).toHaveValue(
      "My goal",
    );
  });
  it("completes, reopens, filters and deletes tasks with confirmation", async () => {
    state.items = [
      {
        id: "t1",
        title: "Practice",
        note: "One question",
        dueDate: "2027-01-01",
        status: "todo",
      },
      {
        id: "t2",
        title: "Portfolio",
        note: "",
        dueDate: "2027-01-01",
        status: "done",
      },
    ];
    open(<CareerPlanner />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Practice" }));
    await waitFor(() =>
      expect(state.change).toHaveBeenCalledWith("t1", "done"),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reopen Portfolio" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reopen Portfolio" }));
    await waitFor(() =>
      expect(state.change).toHaveBeenCalledWith("t2", "todo"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Completed", exact: true }),
    );
    expect(screen.queryByText("Practice")).not.toBeInTheDocument();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete Portfolio" }));
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith("t2"));
  });
  it("filters curated resources and loads another page", () => {
    state.items = [
      {
        id: "r1",
        title: "Interview guide",
        description: "Practice aloud",
        category: "Interview prep",
        url: "https://example.com/guide",
        status: "published",
      },
    ];
    open(<ResourceLibrary />);
    expect(screen.getByRole("link", { name: "Open resource" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    fireEvent.change(screen.getByLabelText("Search loaded resources"), {
      target: { value: "missing" },
    });
    expect(screen.queryByText("Interview guide")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(state.loadMore).toHaveBeenCalledOnce();
  });
  it("admin edits a draft resource without changing creator fields", async () => {
    state.items = [
      {
        id: "r1",
        title: "Interview guide",
        description: "Practice aloud",
        category: "Interview prep",
        url: "https://example.com/guide",
        status: "draft",
      },
    ];
    open(<ResourceLibrary manage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit", exact: true }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save resource" }));
    await waitFor(() =>
      expect(state.save).toHaveBeenCalledWith(
        "alice",
        expect.objectContaining({ title: "New title", status: "draft" }),
        "r1",
      ),
    );
  });
  it("does not expose student profiles or contact details in the admin directory", () => {
    state.items = [
      {
        id: "alice",
        name: "Private Student",
        email: "private@example.test",
        mobile: "+919000000001",
      },
    ];
    open(<StudentDirectory />);
    expect(screen.getByText("Private student profiles")).toBeInTheDocument();
    expect(screen.queryByText("Private Student")).not.toBeInTheDocument();
    expect(screen.queryByText("private@example.test")).not.toBeInTheDocument();
    expect(screen.queryByText("+919000000001")).not.toBeInTheDocument();
  });
});
