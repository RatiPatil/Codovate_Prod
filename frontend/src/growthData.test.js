import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_, n) => n,
  doc: (...a) => a.slice(-2).join("/"),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: () => "SERVER",
  Timestamp: { fromMillis: (n) => ({ toMillis: () => n }) },
  runTransaction: (_, fn) =>
    fn({ get: mock.get, set: mock.set, update: mock.update }),
}));
import {
  sessionInput,
  announcementInput,
  requestMentoring,
  changeBooking,
  calendarEvent,
} from "./growthData";
const draft = {
  title: "Practice",
  mentorName: "Mentor",
  topic: "Interview practice",
  description: "Discuss your project.",
  startsAt: "2099-01-01T10:00:00Z",
  durationMinutes: "30",
  format: "Online",
  location: "",
  status: "draft",
};
const snap = (d) => ({ exists: () => !!d, data: () => d });
beforeEach(() => Object.values(mock).forEach((m) => m.mockReset()));
describe("mentoring and updates data", () => {
  it("validates future sessions and normalizes duration", () =>
    expect(sessionInput(draft).durationMinutes).toBe(30));
  it("rejects expired sessions, oversized durations and missing in-person locations", () => {
    for (const patch of [
      { startsAt: "2020-01-01" },
      { durationMinutes: 121 },
      { format: "In person" },
      { topic: "Unknown" },
    ])
      expect(() => sessionInput({ ...draft, ...patch })).toThrow();
  });
  it("validates announcements and rejects unsafe links", () => {
    expect(
      announcementInput({
        title: " News ",
        body: "A useful update",
        category: "Learning",
        status: "draft",
        link: "",
      }).title,
    ).toBe("News");
    expect(() =>
      announcementInput({
        title: "News",
        body: "Update",
        category: "Learning",
        status: "published",
        link: "javascript:alert(1)",
      }),
    ).toThrow();
  });
  it("rejects duplicate bookings without overwriting the note", async () => {
    mock.get.mockImplementation((ref) =>
      Promise.resolve(
        snap(
          ref.startsWith("mentorBookings")
            ? { status: "pending" }
            : sessionInput(draft),
        ),
      ),
    );
    await expect(
      requestMentoring(
        { uid: "alice" },
        { name: "Alice" },
        "m1",
        "Help me prepare.",
      ),
    ).rejects.toThrow("already requested");
    expect(mock.set).not.toHaveBeenCalled();
  });
  it("creates pending bookings with immutable session snapshots and no public meeting URL", async () => {
    mock.get.mockImplementation((ref) =>
      Promise.resolve(
        snap(
          ref.startsWith("mentorBookings")
            ? null
            : { ...sessionInput(draft), status: "published" },
        ),
      ),
    );
    await requestMentoring(
      { uid: "alice" },
      { name: "Alice" },
      "m1",
      "Help me prepare.",
    );
    expect(mock.set).toHaveBeenCalledWith(
      "mentorBookings/alice_m1",
      expect.objectContaining({
        studentId: "alice",
        sessionId: "m1",
        status: "pending",
        meetingUrl: "",
        sessionTitle: "Practice",
      }),
    );
  });
  it("refuses stale decisions after cancellation", async () => {
    mock.get.mockResolvedValue(snap({ status: "cancelled" }));
    await expect(
      changeBooking("alice_m1", "confirmed", "https://example.com/meeting"),
    ).rejects.toThrow("has changed");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("requires online confirmation links and refuses early completion", async () => {
    mock.get.mockResolvedValue(
      snap({ ...sessionInput(draft), status: "pending" }),
    );
    await expect(changeBooking("alice_m1", "confirmed", "")).rejects.toThrow(
      "meeting link",
    );
    mock.get.mockResolvedValue(
      snap({ ...sessionInput(draft), status: "confirmed" }),
    );
    await expect(changeBooking("alice_m1", "completed", "")).rejects.toThrow(
      "session has ended",
    );
  });
  it("exports UTC calendar times and escapes text instead of injecting calendar properties", () => {
    const text = calendarEvent({
      id: "alice_m1",
      sessionTitle: "Practice, project\nBEGIN:OTHER",
      mentorName: "Mentor",
      startsAt: { toMillis: () => Date.parse("2099-01-01T10:00:00Z") },
      durationMinutes: 30,
      location: "Online",
    });
    expect(text).toContain("DTSTART:20990101T100000Z\r\n");
    expect(text).toContain("DTEND:20990101T103000Z\r\n");
    expect(text).toContain("Practice\\, project\\nBEGIN:OTHER");
    expect(text).not.toContain("\r\nBEGIN:OTHER");
  });
});
it("folds long Unicode calendar content to valid 75-byte lines", () => {
  const text = calendarEvent({
    id: "a",
    sessionTitle: "अ".repeat(60),
    mentorName: "Mentor",
    startsAt: { toMillis: () => Date.parse("2099-01-01T10:00:00Z") },
    durationMinutes: 30,
    location: "Online",
  });
  expect(
    text
      .split("\r\n")
      .every((line) => new TextEncoder().encode(line).length <= 75),
  ).toBe(true);
  expect(text.replace(/\r\n /g, "")).toContain("SUMMARY:" + "अ".repeat(60));
});
