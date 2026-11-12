import { expect, it, vi } from "vitest";
vi.mock("./firebase", () => ({ db: {} }));
const write = vi.hoisted(() => vi.fn());
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => path.join("/"),
  setDoc: write,
  serverTimestamp: () => "SERVER",
}));
import { markChatRead, setChatTyping, messageReadCount } from "./chatSignals";
it("stores only the current participants typing flag and server time", async () => {
  await setChatTyping("room", "alice", true);
  expect(write).toHaveBeenCalledWith("conversations/room/typing/alice", {
    uid: "alice",
    active: true,
    updatedAt: "SERVER",
  });
});
it("acknowledges an existing displayed message with a server timestamp", async () => {
  await markChatRead("room", "alice", "message");
  expect(write).toHaveBeenCalledWith("conversations/room/readReceipts/alice", {
    uid: "alice",
    lastMessageId: "message",
    lastReadAt: "SERVER",
  });
});
it("never invents read states for pending messages or nonparticipants", () => {
  const message = { createdAt: { toMillis: () => 100 } };
  const receipts = [
    { uid: "bob", lastReadAt: { toMillis: () => 101 } },
    { uid: "outsider", lastReadAt: { toMillis: () => 200 } },
  ];
  expect(messageReadCount(message, receipts, ["alice", "bob"], "alice")).toBe(
    1,
  );
  expect(
    messageReadCount(
      { ...message, pending: true },
      receipts,
      ["alice", "bob"],
      "alice",
    ),
  ).toBe(0);
  expect(messageReadCount(message, receipts, ["alice"], "alice")).toBe(0);
});
