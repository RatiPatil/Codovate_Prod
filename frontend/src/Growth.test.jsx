import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({
  user: { uid: "alice" },
  sessions: [],
  bookings: [],
  updates: [],
  request: vi.fn(),
  change: vi.fn(),
  publish: vi.fn(),
  save: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("./firebase", () => ({ configured: true }));
vi.mock("./session", () => ({
  useSession: () => ({ user: state.user, profile: { name: "Alice" } }),
}));
vi.mock("./careerData", () => ({
  useCareerPage: (kind) => ({
    items:
      kind === "mentorSessions"
        ? state.sessions
        : kind === "mentorBookings"
          ? state.bookings
          : state.updates,
    loading: false,
    error: null,
    more: false,
    refresh: state.refresh,
  }),
}));
vi.mock("./growthData", async () => ({
  ...(await vi.importActual("./growthData")),
  requestMentoring: state.request,
  changeBooking: state.change,
  publishSession: state.publish,
  saveAnnouncement: state.save,
}));
import { Mentoring, Updates, BookingAdmin } from "./Growth";
const session = {
  id: "m1",
  title: "Project interview",
  mentorName: "Mentor",
  topic: "Interview practice",
  description: "Discuss your approach",
  status: "published",
  format: "Online",
  location: "Online",
  durationMinutes: 30,
  startsAt: {
    toMillis: () => Date.parse("2099-01-01"),
    toDate: () => new Date("2099-01-01"),
  },
};
beforeEach(() => {
  state.user = { uid: "alice" };
  state.sessions = [session];
  state.bookings = [];
  state.updates = [];
  Object.values(state).forEach((v) => {
    if (v?.mockReset) v.mockReset();
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function open(component, path = "/mentoring") {
  return render(
    <MemoryRouter initialEntries={[path]}>{component}</MemoryRouter>,
  );
}
it("requests guidance using the current profile then opens My bookings", async () => {
  open(<Mentoring />);
  fireEvent.click(screen.getByRole("button", { name: "Request a place" }));
  fireEvent.change(screen.getByLabelText("What would you like help with?"), {
    target: { value: "Explain my portfolio" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
  await waitFor(() =>
    expect(state.request).toHaveBeenCalledWith(
      { uid: "alice" },
      { name: "Alice" },
      "m1",
      "Explain my portfolio",
    ),
  );
  expect(await screen.findByText(/Request sent/)).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "My bookings" })).toHaveAttribute(
      "aria-pressed",
      "true",
    ),
  );
});
it("preserves the request draft on a rejected write", async () => {
  state.request.mockRejectedValue(new Error("Complete your profile first."));
  open(<Mentoring />);
  fireEvent.click(screen.getByRole("button", { name: "Request a place" }));
  fireEvent.change(screen.getByLabelText("What would you like help with?"), {
    target: { value: "My question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Complete your profile first.",
  );
  expect(screen.getByLabelText("What would you like help with?")).toHaveValue(
    "My question",
  );
});
it("offers sign-in instead of a public booking mutation", () => {
  state.user = null;
  open(<Mentoring />);
  expect(
    screen.getByRole("link", { name: "Sign in to request" }),
  ).toHaveAttribute("href", "/login");
  expect(
    screen.queryByRole("button", { name: "Request a place" }),
  ).not.toBeInTheDocument();
});
it("lets a student cancel an existing request after confirmation", async () => {
  state.bookings = [
    {
      ...session,
      id: "alice_m1",
      sessionTitle: session.title,
      note: "Help",
      status: "pending",
    },
  ];
  open(<Mentoring />, "/mentoring?view=mine");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
  await waitFor(() =>
    expect(state.change).toHaveBeenCalledWith("alice_m1", "cancelled"),
  );
});
it("admin saves a confirmation with the private meeting URL", async () => {
  state.bookings = [
    {
      ...session,
      id: "alice_m1",
      studentName: "Alice",
      sessionTitle: session.title,
      note: "Help",
      status: "pending",
    },
  ];
  open(<BookingAdmin />);
  fireEvent.change(
    screen.getByLabelText("HTTPS meeting link (online confirmation)"),
    { target: { value: "https://example.com/meeting" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
  await waitFor(() =>
    expect(state.change).toHaveBeenCalledWith(
      "alice_m1",
      "confirmed",
      "https://example.com/meeting",
      "alice",
    ),
  );
});
it("admin edits an announcement and readers can filter categories", async () => {
  state.updates = [
    {
      id: "n1",
      title: "Learning news",
      body: "Try the learning library.",
      category: "Learning",
      status: "published",
      link: "",
    },
  ];
  open(<Updates manage />, "/updates");
  fireEvent.click(screen.getByRole("button", { name: "Edit update" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated learning news" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save update" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith(
      "alice",
      expect.objectContaining({ title: "Updated learning news" }),
      "n1",
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Community", exact: true }),
  );
  expect(screen.queryByText("Learning news")).not.toBeInTheDocument();
});
