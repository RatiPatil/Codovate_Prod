import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
const state = vi.hoisted(() => ({
  user: { uid: "alice" },
  profile: { name: "Alice" },
  projects: [],
  teams: [],
  requests: [],
  save: vi.fn(),
  join: vi.fn(),
  review: vi.fn(),
  moderate: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
  page: vi.fn(),
  read: vi.fn(),
}));
vi.mock("./firebase", () => ({ configured: true, db: {} }));
vi.mock("firebase/firestore", async () => ({
  ...(await vi.importActual("firebase/firestore")),
  getDoc: state.read,
  doc: (_, collection, id) => collection + "/" + id,
}));
vi.mock("./session", () => ({
  useSession: () => ({
    user: state.user,
    profile: state.profile,
    admin: false,
  }),
}));
vi.mock("./careerData", () => ({
  useCareerPage: (kind, uid, admin, scope) => {
    state.page(kind, uid, admin, scope);
    return {
      items:
        kind === "projects"
          ? state.projects
          : kind === "teams"
            ? state.teams
            : state.requests,
      loading: false,
      error: null,
      more: false,
      refresh: state.refresh,
    };
  },
}));
vi.mock("./communityData", async () => {
  const original = await vi.importActual("./communityData");
  return {
    ...original,
    saveCommunity: state.save,
    requestTeam: state.join,
    reviewRequest: state.review,
    moderateCommunity: state.moderate,
    deleteProject: state.remove,
  };
});
import { Projects, Teams, ProjectDetails } from "./Community";
const project = {
  id: "p1",
  studentId: "alice",
  studentName: "Alice",
  title: "Campus app",
  summary: "A useful student app",
  category: "Web & apps",
  skills: ["React"],
  visibility: "private",
  moderation: "visible",
  repoUrl: "https://example.com/repo",
  demoUrl: "",
};
const team = {
  id: "t1",
  studentId: "bob",
  studentName: "Bob",
  title: "Campus builders",
  summary: "Build something useful",
  category: "Social impact",
  skills: ["React"],
  lookingFor: "A designer",
  status: "open",
};
beforeEach(() => {
  state.user = { uid: "alice" };
  state.projects = [];
  state.teams = [];
  state.requests = [];
  Object.values(state).forEach((v) => {
    if (v?.mockReset) v.mockReset();
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function open(component, path = "/projects") {
  return render(
    <MemoryRouter initialEntries={[path]}>{component}</MemoryRouter>,
  );
}
function fillProject() {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "My project" },
  });
  fireEvent.change(screen.getByLabelText("What did you build?"), {
    target: { value: "A student app" },
  });
}
describe("community workflows", () => {
  it("removes an unsaved private project draft immediately on sign out", () => {
    const view = open(<Projects />);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    fillProject();
    state.user = null;
    view.rerender(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Build my portfolio" }),
    ).toBeInTheDocument();
  });

  it("opens a project spotlight through its direct URL", async () => {
    state.read.mockResolvedValue({
      exists: () => true,
      id: "p1",
      data: () => ({ ...project, visibility: "public" }),
    });
    render(
      <MemoryRouter initialEntries={["/projects/p1"]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Campus app", level: 1 }),
    ).toBeInTheDocument();
    expect(state.read).toHaveBeenCalledWith("projects/p1");
    expect(
      screen.getByRole("button", { name: "Copy project link" }),
    ).toBeEnabled();
  });
  it("does not expose private project content when Firestore denies a direct link", async () => {
    state.read.mockRejectedValue({ code: "permission-denied" });
    render(
      <MemoryRouter initialEntries={["/projects/private"]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Project unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Campus app")).not.toBeInTheDocument();
  });

  it("projects are private by default and save with the signed-in identity", async () => {
    open(<Projects />);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    expect(screen.getByLabelText("Visibility")).toHaveValue("private");
    fillProject();
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() =>
      expect(state.save).toHaveBeenCalledWith(
        "projects",
        { uid: "alice" },
        { name: "Alice" },
        expect.objectContaining({ visibility: "private", title: "My project" }),
        null,
      ),
    );
    expect(await screen.findByText("Project saved.")).toBeInTheDocument();
  });
  it("preserves unsaved input when a write fails", async () => {
    state.save.mockRejectedValue(new Error("Complete your profile first."));
    open(<Projects />);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    fillProject();
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Complete your profile first.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("My project");
    expect(state.refresh).not.toHaveBeenCalled();
  });
  it("only exposes project editing controls to its owner", () => {
    state.projects = [{ ...project, studentId: "bob", visibility: "public" }];
    open(<Projects />);
    expect(
      screen.queryByRole("button", { name: "Edit", exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
  it("admin can hide a project", async () => {
    state.projects = [project];
    open(<Projects manage />);
    fireEvent.click(screen.getByRole("button", { name: "Hide", exact: true }));
    await waitFor(() =>
      expect(state.moderate).toHaveBeenCalledWith("projects", "p1", "hidden"),
    );
  });
  it("anonymous showcase offers sign in instead of editable controls", () => {
    state.user = null;
    open(<Projects />);
    expect(
      screen.getByRole("link", { name: "Build my portfolio" }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("button", { name: "Add project" }),
    ).not.toBeInTheDocument();
  });
  it("sends a join request after explaining who can read it", async () => {
    state.teams = [team];
    open(<Teams />, "/teams");
    fireEvent.click(screen.getByRole("button", { name: "Request to join" }));
    expect(
      screen.getByText(/Your profile name and this note will be shared/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Introduce yourself"), {
      target: { value: "I can help with design." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send join request" }));
    await waitFor(() =>
      expect(state.join).toHaveBeenCalledWith(
        { uid: "alice" },
        { name: "Alice" },
        "t1",
        "I can help with design.",
      ),
    );
    expect(await screen.findByText(/Request sent/)).toBeInTheDocument();
  });
  it("team owner can review and accept an introduction", async () => {
    state.teams = [{ ...team, studentId: "alice" }];
    state.requests = [
      {
        id: "bob_t1",
        studentName: "Bob",
        teamTitle: "Campus builders",
        note: "I can help.",
        status: "pending",
      },
    ];
    open(<Teams />, "/teams?view=mine");
    fireEvent.click(screen.getByRole("button", { name: "Review requests" }));
    expect(
      screen.getByRole("heading", { name: "Requests for Campus builders" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept request" }));
    await waitFor(() =>
      expect(state.review).toHaveBeenCalledWith("bob_t1", "accepted"),
    );
  });
  it("applicant can withdraw an accepted introduction with confirmation", async () => {
    state.requests = [
      {
        id: "alice_t1",
        studentName: "Alice",
        teamTitle: "Campus builders",
        note: "Interested",
        status: "accepted",
      },
    ];
    open(<Teams />, "/teams?view=requests");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw request" }));
    await waitFor(() =>
      expect(state.review).toHaveBeenCalledWith("alice_t1", "withdrawn"),
    );
  });
  it("does not submit a form twice while its first write is pending", async () => {
    let finish;
    state.save.mockImplementation(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    );
    open(<Projects />);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    fillProject();
    const form = screen.getByLabelText("Title").closest("form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(state.save).toHaveBeenCalledOnce();
    finish();
    await screen.findByText("Project saved.");
  });
});
