import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
const state = vi.hoisted(() => ({ data: null, save: vi.fn(), stop: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_, c, id) => `${c}/${id}`,
  onSnapshot: (_, fn) => {
    fn({ exists: () => !!state.data, data: () => state.data });
    return state.stop;
  },
}));
vi.mock("./mentoringWorkspaceData", async () => ({
  ...(await vi.importActual("./mentoringWorkspaceData")),
  saveMentoringWorkspace: state.save,
}));
import MentorWorkspace from "./MentorWorkspace";
const booking = { id: "alice_m1", status: "confirmed" };
beforeEach(() => {
  state.data = null;
  state.save.mockReset();
  state.stop.mockReset();
});
afterEach(cleanup);
it("saves student preparation without exposing admin action-plan controls", async () => {
  render(<MentorWorkspace booking={booking} />);
  fireEvent.change(screen.getByLabelText("One goal for this session"), {
    target: { value: "Review my API" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save preparation" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith("alice_m1", "preparation", {
      goal: "Review my API",
      context: "",
      artifactUrl: "",
    }),
  );
  expect(
    screen.queryByRole("button", { name: "Share action plan" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("How useful was the session?"),
  ).not.toBeInTheDocument();
});
it("shows the mentor plan and saves checkbox progress with the original action", async () => {
  state.data = {
    preparation: {
      goal: "Review API",
      context: "Built a prototype",
      artifactUrl: "",
    },
    plan: { summary: "Improve error handling", actions: ["Add failure tests"] },
    completedActions: [],
  };
  render(<MentorWorkspace booking={booking} />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Add failure tests" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith("alice_m1", "progress", {
      index: 0,
      action: "Add failure tests",
      checked: true,
    }),
  );
  expect(screen.getByRole("progressbar")).toHaveAttribute("max", "1");
});
it("admins read student preparation and share a bounded action plan", async () => {
  render(<MentorWorkspace booking={booking} manage />);
  expect(
    screen.queryByLabelText("One goal for this session"),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Session takeaway"), {
    target: { value: "Prioritize tests" },
  });
  fireEvent.change(screen.getByLabelText("Next step 1"), {
    target: { value: "Test one endpoint" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Share action plan" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith("alice_m1", "plan", {
      summary: "Prioritize tests",
      action1: "Test one endpoint",
      action2: "",
      action3: "",
    }),
  );
});
it("completed sessions enable reflections; cancelled sessions are read-only", () => {
  const { rerender } = render(
    <MentorWorkspace booking={{ ...booking, status: "completed" }} />,
  );
  expect(
    screen.getByLabelText("How useful was the session?"),
  ).toBeInTheDocument();
  rerender(<MentorWorkspace booking={{ ...booking, status: "cancelled" }} />);
  expect(
    screen.queryByRole("button", { name: "Save preparation" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Save reflection" }),
  ).not.toBeInTheDocument();
});
it("a failed save keeps the entered preparation", async () => {
  state.save.mockRejectedValue(new Error("Please retry"));
  render(<MentorWorkspace booking={booking} />);
  fireEvent.change(screen.getByLabelText("One goal for this session"), {
    target: { value: "Keep this goal" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save preparation" }));
  await screen.findByText("Please retry");
  expect(screen.getByLabelText("One goal for this session")).toHaveValue(
    "Keep this goal",
  );
});
