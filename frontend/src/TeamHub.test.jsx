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
  visibilityCached: false,
  publish: vi.fn(),
  hide: vi.fn(),
  connect: vi.fn(),
  decision: vi.fn(),
  feeds: {},
  feedCalls: [],
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./session", () => ({
  useSession: () => ({
    user: { uid: "alice" },
    profile: { name: "Alice", skills: ["React"] },
  }),
}));
vi.mock("./StudyFieldAdmin", async () => {
  const {knownStudyFields} = await import("./studyFields");
  return {useStudyFieldCatalog: () => ({fields: knownStudyFields, error: ""})};
});
vi.mock("./Community", () => ({
  Teams: () => <div>Recruiting teams module</div>,
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => p.join("/"),
  onSnapshot: (path, options, next) => {
    const fn = typeof options === "function" ? options : next;
    fn({
      exists: () => fake.published,
      metadata: { fromCache: fake.visibilityCached },
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
  useTeamFeed: (path, _uid, filters = []) => {
    fake.feedCalls.push({ path, filters });
    return {
      items:
        path === "connections"
          ? fake.feeds[filters[0]?.[0]] || []
          : fake.feeds[path] || [],
      loading: false,
      error: "",
      cached: false,
    };
  },
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
vi.mock("./discoveryData", async (original) => ({
  ...(await original()),
  ensureDefaultDiscovery: vi.fn().mockResolvedValue(),
}));
import { TeamHub } from "./TeamHub";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  fake.feeds = {};
  fake.feedCalls = [];
  fake.published = false;
  fake.visibilityCached = false;
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
  fireEvent.click(screen.getByRole("button", { name: "My Teams" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "Earlier recruiting teams and requests",
    }),
  );
  expect(screen.getByText("Recruiting teams module")).toBeTruthy();
});

it("opens My Teams with a clear empty state and preserves the earlier board", () => {
  render(
    <MemoryRouter initialEntries={["/teams"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(screen.getByText("You haven't joined any teams yet.")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Earlier recruiting teams and requests",
    }),
  );
  expect(screen.getByText("Recruiting teams module")).toBeTruthy();
});
it("keeps earlier private workspaces visible in My Teams without rewriting their identity", () => {
  fake.feeds.conversations = [
    {
      id: "earlier-room",
      title: "Earlier Project",
      ownerId: "bob",
      members: ["alice", "bob"],
      status: "active",
      kind: "group",
    },
  ];
  render(
    <MemoryRouter initialEntries={["/teams"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(screen.getByText("Earlier Project")).toBeTruthy();
  expect(screen.queryByText("You haven't joined any teams yet.")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Open earlier workspace" }),
  ).toBeTruthy();
});

it("offers real direct chat for accepted connections", () => {
  fake.feeds.fromId = [
    { id: "alice_bob", fromId: "alice", toId: "bob", status: "accepted" },
  ];
  render(
    <MemoryRouter initialEntries={["/teams?hub=connections"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: "Open chat" })).toBeEnabled();
  expect(screen.getByRole("heading", { name: "Group chats" })).toBeTruthy();
  expect(screen.queryByText(/Realtime chat is under development/)).toBeNull();
});

it("lets students browse joinable teams directly from My Teams", () => {
  render(
    <MemoryRouter initialEntries={["/teams"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Join team", exact: true }),
  );
  expect(
    screen.getByRole("heading", { name: "Find a team to join" }),
  ).toBeTruthy();
  expect(screen.getByLabelText("Search recruiting project teams")).toBeTruthy();
});

it("does not change discovery visibility before an empty cached profile is confirmed", () => {
  fake.visibilityCached = true;
  render(
    <MemoryRouter initialEntries={["/teams"]}>
      <TeamHub />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("button", { name: "Make my profile discoverable" }),
  ).toBeDisabled();
});

it("queries the selected field of study across the directory", () => {
  fake.feeds.memberProfiles = [
    {
      uid: "mech",
      name: "Mechanical Student",
      skills: [],
      details: { fieldOfStudy: "MECHANICAL ENGINEERING" },
    },
    {
      uid: "cs",
      name: "Computer Student",
      skills: [],
      details: { fieldOfStudy: "COMPUTER SCIENCE AND ENGINEERING" },
    },
  ];
  render(
    <MemoryRouter
      initialEntries={["/teams?hub=people&study=mechanical%20engineering"]}
    >
      <TeamHub />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Mechanical Student" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "Computer Student" }),
  ).toBeNull();
  expect(screen.getByLabelText("Filter by field of study")).toHaveValue(
    "MECHANICAL ENGINEERING",
  );
  expect(
    fake.feedCalls.some(
      (call) =>
        call.path === "memberProfiles" &&
        call.filters[0]?.[0] === "details.fieldOfStudy" &&
        call.filters[0]?.[2] === "MECHANICAL ENGINEERING",
    ),
  ).toBe(true);
});
