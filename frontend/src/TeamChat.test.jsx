import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./session", () => ({
  useSession: () => ({ user: { uid: "alice" }, profile: { name: "Alice" } }),
}));
vi.mock("./teamHubData", () => ({
  useTeamFeed: () => ({ items: [], loading: false, error: "", cached: false }),
  inviteToGroup: vi.fn(),
  updateGroup: vi.fn(),
  sendTeamMessage: vi.fn(),
  revokeGroupInvite: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => ({ path: p.join("/") }),
  collection: (_db, ...p) => p.join("/"),
  query: (path) => ({ path }),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: (ref, options, next) => {
    const callback = typeof options === "function" ? options : next;
    if (ref.path.endsWith("/messages"))
      callback({ docs: [], size: 0, metadata: { fromCache: false } });
    else
      callback({
        id: "studio",
        exists: () => true,
        data: () => ({ kind: "team", teamId: "studio" }),
      });
    return () => {};
  },
}));
const signals = vi.hoisted(() => ({ typing: vi.fn().mockResolvedValue() }));
vi.mock("./chatSignals", async (original) => ({
  ...(await original()),
  setChatTyping: signals.typing,
}));
import { TeamChat } from "./TeamChat";
afterEach(cleanup);
it("uses canonical team title and disables sending when the team is archived", () => {
  const view = render(
    <TeamChat
      id="studio"
      team={{ title: "Project Studio", lifecycle: "archived" }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("heading", { name: "Project Studio" })).toBeTruthy();
  expect(screen.getByLabelText("Message")).toBeDisabled();
  view.rerender(
    <TeamChat
      id="studio"
      team={{ title: "Project Studio", lifecycle: "active" }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("Message")).not.toBeDisabled();
});

it("immediately resumes typing after clearing a draft", () => {
  signals.typing.mockClear();
  render(
    <TeamChat
      id="studio"
      team={{
        title: "Project Studio",
        lifecycle: "active",
        members: ["alice", "bob"],
      }}
      onClose={vi.fn()}
    />,
  );
  const field = screen.getByLabelText("Message", { exact: true });
  fireEvent.change(field, { target: { value: "First draft" } });
  fireEvent.change(field, { target: { value: "" } });
  fireEvent.change(field, { target: { value: "Second draft" } });
  expect(signals.typing.mock.calls.map((call) => call[2])).toEqual([
    true,
    false,
    true,
  ]);
});
