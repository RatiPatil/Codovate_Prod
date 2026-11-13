import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
const mock = vi.hoisted(() => ({ rows: [], send: vi.fn(), stop: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./session", () => ({
  useSession: () => ({ user: { uid: "alice" } }),
}));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}),
  query: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  onSnapshot: (_, fn) => {
    fn({ docs: mock.rows.map((d, i) => ({ id: String(i), data: () => d })) });
    return mock.stop;
  },
}));
vi.mock("./mentorChatData", () => ({
  mentorMessageId: () => "stable-id",
  sendMentorMessage: mock.send,
}));
import MentorChat from "./MentorChat";
const booking = {
  id: "b1",
  status: "confirmed",
  studentName: "Alice",
  mentorName: "Mentor",
};
beforeEach(() => {
  mock.rows = [];
  mock.send.mockReset();
  mock.stop.mockReset();
});
afterEach(cleanup);
it("renders messages as text rather than HTML and labels the sender", () => {
  mock.rows = [
    {
      senderId: "mentor",
      senderRole: "mentor",
      text: "<img src=x onerror=alert(1) />",
    },
  ];
  const { container } = render(<MentorChat booking={booking} />);
  expect(
    screen.getByText("<img src=x onerror=alert(1) />"),
  ).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("Mentor")).toBeInTheDocument();
});
it("sends once, clears the composer after confirmation, and detaches the listener", async () => {
  const { unmount } = render(<MentorChat booking={booking} />);
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Please review my diagram" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() =>
    expect(mock.send).toHaveBeenCalledWith(
      "b1",
      "stable-id",
      "alice",
      "Please review my diagram",
    ),
  );
  await waitFor(() => expect(screen.getByLabelText("Message")).toHaveValue(""));
  unmount();
  expect(mock.stop).toHaveBeenCalled();
});
it("keeps a failed draft and uses the same ID on retry", async () => {
  mock.send
    .mockRejectedValueOnce(
      Object.assign(new Error("timeout"), { code: "mentoring/send-timeout" }),
    )
    .mockResolvedValueOnce();
  render(<MentorChat booking={booking} />);
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Help with tests" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Message")).toHaveValue("Help with tests");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(mock.send).toHaveBeenCalledTimes(2));
  expect(mock.send.mock.calls[0]).toEqual(mock.send.mock.calls[1]);
});
it("completed and cancelled sessions have no message composer", () => {
  const { rerender } = render(
    <MentorChat booking={{ ...booking, status: "completed" }} />,
  );
  expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  rerender(<MentorChat booking={{ ...booking, status: "cancelled" }} />);
  expect(
    screen.queryByRole("button", { name: "Send message" }),
  ).not.toBeInTheDocument();
});
