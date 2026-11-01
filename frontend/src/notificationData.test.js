import { beforeEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_, n) => n,
  doc: (...a) => a.slice(-2).join("/"),
  serverTimestamp: () => "SERVER",
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: (_, fn) => fn(mock),
}));
import {
  notificationInput,
  sendNotification,
  applicationDecision,
} from "./notificationData";
beforeEach(() => vi.clearAllMocks());
it("validates recipients and rejects arbitrary destinations", () => {
  expect(
    notificationInput({
      studentId: "alice",
      title: "Hello",
      body: "Update",
      link: "/profile",
    }).studentId,
  ).toBe("alice");
  for (const raw of [
    { studentId: "../bob" },
    { link: "https://evil.test" },
    { title: "" },
    { body: "x".repeat(2001) },
  ])
    expect(() =>
      notificationInput({
        studentId: "alice",
        title: "Hello",
        body: "Update",
        link: "",
        ...raw,
      }),
    ).toThrow();
});
it("sends only to an existing profile with private immutable content", async () => {
  mock.get
    .mockResolvedValueOnce({ exists: () => true })
    .mockResolvedValueOnce({ exists: () => false });
  await sendNotification(
    "operator",
    { studentId: "alice", title: "Hello", body: "Update", link: "/profile" },
    "draft-1",
  );
  expect(mock.set).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      studentId: "alice",
      createdBy: "operator",
      read: false,
      createdAt: "SERVER",
    }),
  );
});
it("rejects missing recipients", async () => {
  mock.get.mockResolvedValue({ exists: () => false });
  await expect(
    sendNotification(
      "operator",
      { studentId: "alice", title: "Hi", body: "Update", link: "" },
      "draft-1",
    ),
  ).rejects.toThrow("not found");
  expect(mock.set).not.toHaveBeenCalled();
});
it("retries a delivered draft without duplicating it", async () => {
  mock.get.mockResolvedValue({ exists: () => true });
  await sendNotification(
    "operator",
    { studentId: "alice", title: "Hi", body: "Update", link: "" },
    "draft-1",
  );
  expect(mock.set).not.toHaveBeenCalled();
});
it("application decisions and notifications share one transaction", async () => {
  mock.get.mockResolvedValue({
    exists: () => true,
    data: () => ({
      studentId: "alice",
      status: "submitted",
      opportunityTitle: "Intern",
    }),
  });
  await applicationDecision("operator", "alice_intern", "shortlisted");
  expect(mock.update).toHaveBeenCalledWith(expect.anything(), {
    status: "shortlisted",
    updatedAt: "SERVER",
  });
  expect(mock.set).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      studentId: "alice",
      link: "/applications",
      body: expect.stringContaining("shortlisted"),
    }),
  );
});
it("unchanged application statuses do not generate repeated notifications", async () => {
  mock.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ status: "submitted" }),
  });
  await applicationDecision("operator", "id", "submitted");
  expect(mock.set).not.toHaveBeenCalled();
  expect(mock.update).not.toHaveBeenCalled();
});
