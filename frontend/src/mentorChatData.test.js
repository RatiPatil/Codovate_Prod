import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (...a) => a.slice(1).join("/"),
  doc: (...a) => a.slice(1).join("/"),
  serverTimestamp: () => "SERVER",
  runTransaction: (_, fn) => fn(mock),
}));
import { sendMentorMessage, mentorMessageText } from "./mentorChatData";
const snap = (d) => ({ exists: () => !!d, data: () => d });
beforeEach(() => {
  vi.clearAllMocks();
  mock.get.mockImplementation(async (ref) =>
    snap(
      ref.includes("/messages/")
        ? null
        : { studentId: "alice", mentorUid: "mentor", status: "confirmed" },
    ),
  );
});
it("validates bounded messages and keeps text as plain text", () => {
  expect(mentorMessageText(" <script>example</script> ")).toBe(
    "<script>example</script>",
  );
  expect(() => mentorMessageText(" \n ")).toThrow();
  expect(() => mentorMessageText("x".repeat(2001))).toThrow();
});
it("sends a stable message ID with the correct assigned participant role", async () => {
  await sendMentorMessage("b1", "m1", "mentor", "Review the API");
  expect(mock.set).toHaveBeenCalledWith("mentorBookings/b1/messages/m1", {
    senderId: "mentor",
    senderRole: "mentor",
    text: "Review the API",
    createdAt: "SERVER",
  });
});
it("a retry checks the existing message instead of duplicating it", async () => {
  mock.get.mockImplementation(async (ref) =>
    snap(
      ref.includes("/messages/")
        ? { senderId: "alice", text: "Help" }
        : { status: "confirmed" },
    ),
  );
  await sendMentorMessage("b1", "same-id", "alice", "Help");
  expect(mock.set).not.toHaveBeenCalled();
  await expect(
    sendMentorMessage("b1", "same-id", "alice", "Changed"),
  ).rejects.toThrow("earlier message");
});
it("rejects sends after cancellation or before confirmation", async () => {
  for (const status of ["pending", "cancelled", "completed"]) {
    mock.get.mockImplementation(async (ref) =>
      snap(ref.includes("/messages/") ? null : { studentId: "alice", status }),
    );
    await expect(
      sendMentorMessage("b1", "m1", "alice", "Help"),
    ).rejects.toThrow("after confirmation");
  }
  expect(mock.set).not.toHaveBeenCalled();
});
