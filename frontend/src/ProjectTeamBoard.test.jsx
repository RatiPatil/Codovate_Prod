import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const fake = vi.hoisted(() => ({ feeds: {}, request: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./teamHubData", () => ({
  useTeamFeed: (path) =>
    fake.feeds[path] || { items: [], loading: false, error: "", cached: false },
}));
vi.mock("./projectTeamsData", async (original) => ({
  ...(await original()),
  requestProjectJoin: fake.request,
}));
import { ProjectTeamBoard } from "./ModernTeams";
const listing = {
  id: "studio",
  teamId: "studio",
  ownerId: "leader",
  title: "Studio",
  description: "Build an accessible student tool.",
  requiredSkills: ["React"],
  memberCount: 1,
  capacity: 2,
  recruitment: "recruiting",
  lifecycle: "active",
};
const feed = (items) => ({ items, loading: false, error: "", cached: false });
const open = (props = {}) =>
  render(
    <ProjectTeamBoard
      user={{ uid: "alice" }}
      myPublic
      act={async (action) => action()}
      busy={false}
      {...props}
    />,
  );
beforeEach(() => {
  fake.feeds = { teamListings: feed([listing]) };
  vi.clearAllMocks();
});
afterEach(cleanup);
it("sends the student's introduction through the join request flow", async () => {
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Request to join", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Introduce yourself"), {
    target: { value: "I can help with React." },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Send join request", exact: true }),
  );
  await waitFor(() =>
    expect(fake.request).toHaveBeenCalledWith(
      "alice",
      listing,
      "I can help with React.",
    ),
  );
});
it("prevents duplicate pending requests and labels the actual request state", () => {
  fake.feeds.projectTeamRequests = feed([
    { teamId: "studio", studentId: "alice", status: "pending" },
  ]);
  open();
  expect(
    screen.getByRole("button", { name: "Request sent", exact: true }),
  ).toBeDisabled();
});
it("prevents joining a full team", () => {
  fake.feeds.teamListings = feed([{ ...listing, memberCount: 2 }]);
  open();
  expect(
    screen.getByRole("button", { name: "Team full", exact: true }),
  ).toBeDisabled();
});
it("waits for membership and request records before enabling a join", () => {
  fake.feeds.projectTeamRequests = { ...feed([]), loading: true };
  open();
  expect(
    screen.getByRole("button", { name: "Request to join", exact: true }),
  ).toBeDisabled();
});
it("requires the student's discovery consent before requesting membership", () => {
  open({ myPublic: false });
  expect(
    screen.getByRole("button", { name: "Request to join", exact: true }),
  ).toBeDisabled();
});
