import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const fake = vi.hoisted(() => ({
  published: false,
  publish: vi.fn(),
  hide: vi.fn(),
  connect: vi.fn(),
  decision: vi.fn(),
  feeds: {},
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./session", () => ({
  useSession: () => ({
    user: { uid: "alice" },
    profile: { name: "Alice", skills: ["React"] },
  }),
}));
vi.mock("./Community", () => ({
  Teams: () => <div>Recruiting teams module</div>,
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => p.join("/"),
  onSnapshot: (path, fn) => {
    fn({
      exists: () => fake.published,
      data: () => ({ name: path.endsWith("bob") ? "Bob" : "Alice" }),
    });
    return () => {};
  },
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  startAfter: vi.fn(),
}));
vi.mock("./teamHubData", () => ({
  useTeamFeed: (path, _uid, filters = []) => ({
    items:
      path === "connections"
        ? fake.feeds[filters[0]?.[0]] || []
        : fake.feeds[path] || [],
    loading: false,
    error: "",
    cached: false,
  }),
  publishMember: fake.publish,
  hideMember: fake.hide,
  connectMember: fake.connect,
  connectionDecision: fake.decision,
  openDirect: vi.fn(),
  createGroup: vi.fn(),
  inviteToGroup: vi.fn(),
  answerInvite: vi.fn(),
  updateGroup: vi.fn(),
  sendTeamMessage: vi.fn(),
  revokeGroupInvite: vi.fn(),
}));
import { TeamHub } from "./TeamHub";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  fake.feeds = {};
  fake.published = false;
});
it("shows only name and skills, filters loaded members and keeps publishing opt-in", async () => {
  fake.feeds.memberProfiles = [
    {
      uid: "bob",
      name: "Bob",
      skills: ["Design"],
      email: "private@example.com",
      mobile: "9999999999",
    },
  ];
  render(
    <MemoryRouter initialEntries={["/teams?hub=people"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(screen.getByText("Bob")).toBeTruthy();
  expect(screen.getByText("Design")).toBeTruthy();
  expect(screen.queryByText("private@example.com")).toBeNull();
  expect(screen.queryByText("9999999999")).toBeNull();
  expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "React" },
  });
  expect(screen.queryByText("Bob")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Make my profile discoverable" }),
  );
  await waitFor(() => expect(fake.publish).toHaveBeenCalled());
});
it("accepts a real incoming connection and preserves recruiting module", async () => {
  fake.feeds.toId = [
    { id: "bob_alice", fromId: "bob", toId: "alice", status: "pending" },
  ];
  render(
    <MemoryRouter initialEntries={["/teams?hub=connections"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  await waitFor(() =>
    expect(fake.decision).toHaveBeenCalledWith("bob_alice", "accepted"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Discover teams" }));
  expect(screen.getByText("Recruiting teams module")).toBeTruthy();
});

it("opens the existing team board by default instead of an empty member directory", () => {
  render(
    <MemoryRouter initialEntries={["/teams"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(screen.getByText("Recruiting teams module")).toBeTruthy();
  expect(screen.queryByRole("searchbox")).toBeNull();
});
