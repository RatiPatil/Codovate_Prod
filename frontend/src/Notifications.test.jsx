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
  send: vi.fn(),
  mark: vi.fn(),
  items: [],
  refresh: vi.fn(),
}));
vi.mock("./session", () => ({
  useSession: () => ({
    user: { uid: "operator", email: "admin@example.test" },
  }),
}));
vi.mock("./firebase", () => ({ configured: true, db: null }));
vi.mock("./careerData", () => ({
  useCareerPage: () => ({
    items: state.items,
    refresh: state.refresh,
    loading: false,
    more: false,
    error: null,
  }),
}));
vi.mock("./notificationData", () => ({
  notificationLinks: ["", "/applications"],
  sendNotification: state.send,
  markNotification: state.mark,
  newNotificationId: () => "draft-1",
  useUnreadNotification: () => ({ unread: true, error: false }),
}));
import { Notifications, NotificationNav, AdminOverview } from "./Notifications";
function open(node, path = "/") {
  return render(<MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>);
}
beforeEach(() => {
  vi.clearAllMocks();
  state.items = [];
  state.send.mockResolvedValue();
  state.mark.mockResolvedValue();
});
afterEach(cleanup);
it("student directory deep link preselects recipient and delivers a notification", async () => {
  open(<Notifications manage />, "/admin?tab=notifications&student=alice");
  expect(screen.getByLabelText("Student ID").value).toBe("alice");
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Your update" },
  });
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Check your application" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
  await waitFor(() =>
    expect(state.send).toHaveBeenCalledWith(
      "operator",
      {
        studentId: "alice",
        title: "Your update",
        body: "Check your application",
        link: "",
      },
      "draft-1",
    ),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("delivered");
});
it("failed delivery keeps the message draft", async () => {
  state.send.mockRejectedValue(new Error("Try again"));
  open(<Notifications manage />);
  fireEvent.change(screen.getByLabelText("Student ID"), {
    target: { value: "alice" },
  });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Important" },
  });
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Keep this" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
  expect(screen.getByLabelText("Message").value).toBe("Keep this");
});
it("student marks message read and admin has no read control", async () => {
  state.items = [
    {
      id: "n1",
      title: "Update",
      body: "Hello",
      read: false,
      link: "/applications",
    },
  ];
  open(<Notifications />);
  fireEvent.click(screen.getByRole("button", { name: "Mark read" }));
  await waitFor(() => expect(state.mark).toHaveBeenCalledWith("n1", true));
  cleanup();
  open(<Notifications manage />);
  expect(screen.queryByRole("button", { name: "Mark read" })).toBeNull();
});
it("navigation announces unread messages", () => {
  open(<NotificationNav />);
  expect(
    screen.getByRole("link", { name: /Notifications · New/ }),
  ).toHaveAttribute("href", "/notifications");
});
it("control centre opens module management", () => {
  const openModule = vi.fn();
  open(<AdminOverview open={openModule} />);
  fireEvent.click(screen.getByRole("button", { name: "Manage notifications" }));
  expect(openModule).toHaveBeenCalledWith("notifications");
});
