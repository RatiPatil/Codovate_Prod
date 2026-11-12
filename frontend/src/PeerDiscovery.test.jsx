import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  snapshot: null,
  emit: null,
  dismissed: [],
  connect: vi.fn(),
  dismiss: vi.fn(),
  save: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => path.join("/"),
  onSnapshot: (_ref, _options, next) => {
    state.emit = next;
    next({
      exists: () => !!state.snapshot,
      data: () => state.snapshot,
      metadata: { fromCache: false },
    });
    return () => {};
  },
  runTransaction: vi.fn(),
  serverTimestamp: () => "SERVER",
}));
vi.mock("./teamHubData", () => ({
  useTeamFeed: () => ({ items: state.dismissed, loading: false, error: "" }),
  connectMember: state.connect,
  validatedPublicProfile: vi.fn(),
}));
vi.mock("./discoveryData", async (original) => ({
  ...(await original()),
  dismissPeer: state.dismiss,
  saveDiscovery: state.save,
}));
import { PeerDiscovery } from "./PeerDiscovery";
const profile = {
  name: "Alice",
  skills: ["React"],
  college: "Example College",
  degree: "MCA",
  city: "Pune",
  careerPreferences: {
    domain: "AI/ML",
    experience: "Beginner",
    yearOfStudy: "Final year",
    seeking: ["Project Collaborators"],
  },
  teammateCard: { passions: ["Open Source"] },
};
const bob = {
  uid: "bob",
  name: "Bob",
  skills: ["React"],
  email: "private@example.com",
  mobile: "9999999999",
  details: {
    desiredRole: "AI Engineer",
    degree: "MCA",
    college: "Example College",
    year: "Third year",
    location: "Pune",
    domain: "AI/ML",
    experience: "Beginner",
    achievements: ["SIH Participant"],
    seeking: ["Project Collaborators"],
    passions: ["Open Source"],
    photoUrl: "https://avatars.githubusercontent.com/u/123",
  },
};
function open(extra = {}) {
  return render(
    <PeerDiscovery
      user={{ uid: "alice" }}
      profile={profile}
      people={{ items: [bob], loading: false, error: "" }}
      connections={[]}
      myPublic
      act={async (fn) => fn()}
      busy={false}
      {...extra}
    />,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.snapshot = null;
  state.dismissed = [];
});
afterEach(cleanup);
it("keeps the existing student card and renders shared data with working actions", async () => {
  open();
  expect(screen.getByRole("heading", { name: "Bob" })).toBeInTheDocument();
  expect(screen.getByText("AI Engineer")).toBeInTheDocument();
  expect(
    screen.getByText("MCA • Example College • Third year"),
  ).toBeInTheDocument();
  expect(screen.getByText("SIH Participant")).toBeInTheDocument();
  expect(screen.queryByText("private@example.com")).toBeNull();
  expect(screen.queryByText("9999999999")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Connect", exact: true }));
  await waitFor(() =>
    expect(state.connect).toHaveBeenCalledWith("alice", "bob"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Dismiss", exact: true }));
  await waitFor(() =>
    expect(state.dismiss).toHaveBeenCalledWith("alice", "bob"),
  );
  fireEvent.error(screen.getByRole("img", { name: "Bob profile photo" }));
  expect(screen.queryByRole("img", { name: "Bob profile photo" })).toBeNull();
  expect(screen.getByText("B", { exact: true })).toBeInTheDocument();
});
it("filters students and clears filters without changing the page layout", () => {
  open();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Nobody" },
  });
  expect(
    screen.getByText("No teammates found matching your criteria."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByRole("heading", { name: "Bob" })).toBeInTheDocument();
});
it("shows calculated match labels from onboarding preferences", () => {
  open({ suggested: true });
  expect(screen.getByText("95% Match")).toBeInTheDocument();
  expect(screen.getByText("AI/ML Match")).toBeInTheDocument();
});
it("prefills settings and preserves edits on metadata-only snapshots", () => {
  open();
  const role = screen.getByLabelText("Desired role");
  fireEvent.change(role, { target: { value: "Researcher" } });
  state.emit({
    exists: () => false,
    data: () => undefined,
    metadata: { fromCache: false },
  });
  expect(role).toHaveValue("Researcher");
  expect(screen.getByLabelText("Course / degree")).toHaveValue("MCA");
});
it("does not create duplicate requests for a pending connection", () => {
  open({
    connections: [
      { id: "alice_bob", fromId: "alice", toId: "bob", status: "pending" },
    ],
  });
  expect(
    screen.queryByRole("button", { name: "Connect", exact: true }),
  ).toBeNull();
  expect(screen.getByRole("link", { name: "Request sent" })).toHaveAttribute(
    "href",
    "/teams?hub=connections",
  );
});

it("combines domain and experience filters with an explicit all-level reset", () => {
  open();
  fireEvent.change(screen.getByLabelText("Filter by domain or goal"), {
    target: { value: "AI/ML" },
  });
  expect(screen.getByRole("heading", { name: "Bob" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filter by experience level"), {
    target: { value: "Advanced" },
  });
  expect(
    screen.getByText("No teammates found matching your criteria."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByRole("heading", { name: "Bob" })).toBeInTheDocument();
});

it("waits for connection state before allowing duplicate-prone connect actions", () => {
  open({
    connectionsReady: false,
    connectionsError: "Connection requests could not be loaded.",
  });
  expect(
    screen.getByRole("button", { name: "Connect", exact: true }),
  ).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Connection requests could not be loaded.",
  );
});

it("keeps long skill lists compact and reveals all values on request", () => {
  open({
    people: {
      items: [{ ...bob, skills: ["React", "Java", "Python", "ML", "Design"] }],
      loading: false,
      error: "",
    },
  });
  expect(screen.queryByText("Design", { exact: true })).toBeNull();
  const toggle = screen.getByRole("button", { name: "Show all skills" });
  fireEvent.click(toggle);
  expect(screen.getByText("Design", { exact: true })).toBeInTheDocument();
  expect(toggle).toHaveAttribute("aria-expanded", "true");
});

it("shows imported default skills as suggested and makes them searchable", () => {
  open({
    people: {
      items: [
        {
          ...bob,
          skills: [],
          suggestedSkills: ["Programming fundamentals", "Web fundamentals"],
        },
      ],
      loading: false,
      error: "",
    },
  });
  expect(
    screen.getByText("Program-based skills", { exact: true }),
  ).toBeInTheDocument();
  expect(screen.getByText("Suggested", { exact: true })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Skill", { exact: true }), {
    target: { value: "Web fundamentals" },
  });
  expect(screen.getByRole("heading", { name: "Bob" })).toBeInTheDocument();
});

it("sorts students by listed skills and restores alphabetical order", () => {
  open({
    people: {
      items: [
        bob,
        {
          ...bob,
          uid: "carol",
          name: "Carol",
          skills: ["React", "Java", "Python"],
        },
      ],
      loading: false,
      error: "",
    },
  });
  fireEvent.change(screen.getByLabelText("Sort students"), {
    target: { value: "skills" },
  });
  expect(
    within(screen.getAllByRole("article")[0]).getByRole("heading", {
      name: "Carol",
    }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Sort students"), {
    target: { value: "name" },
  });
  expect(
    within(screen.getAllByRole("article")[0]).getByRole("heading", {
      name: "Bob",
    }),
  ).toBeInTheDocument();
});
