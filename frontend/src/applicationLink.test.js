import { beforeEach, it, expect, vi } from "vitest";
const f = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("./firebase", () => ({ db: {}, configured: true }));
vi.mock("firebase/firestore", async () => ({
  ...(await vi.importActual("firebase/firestore")),
  doc: (_, name, id) => name + "/" + id,
  serverTimestamp: () => "SERVER",
  runTransaction: (_, fn) => fn({ get: f.get, set: f.set }),
}));
import { applyToOpportunity } from "./data";
const listing = {
  title: "React intern",
  organization: "Studio",
  status: "published",
  closesAt: { toMillis: () => Date.parse("2099-01-01") },
};
beforeEach(() => {
  f.get.mockReset();
  f.set.mockReset();
  f.get.mockImplementation((ref) =>
    Promise.resolve({
      exists: () => ref.startsWith("opportunities"),
      data: () => listing,
    }),
  );
});
it("submits a resume-link snapshot without invoking file upload", async () => {
  await applyToOpportunity(
    { uid: "alice" },
    {
      name: "Alice",
      college: "College",
      resumePath: "",
      resumeUrl: "https://example.com/resume",
    },
    { id: "op1" },
    "My introduction",
  );
  expect(f.set).toHaveBeenCalledWith(
    "applications/alice_op1",
    expect.objectContaining({
      resumePath: "",
      resumeUrl: "https://example.com/resume",
      status: "submitted",
      studentId: "alice",
    }),
  );
});
it("rejects unsafe resume links before creating an application", async () => {
  await expect(
    applyToOpportunity(
      { uid: "alice" },
      {
        name: "Alice",
        college: "College",
        resumePath: "",
        resumeUrl: "javascript:alert(1)",
      },
      { id: "op1" },
      "",
    ),
  ).rejects.toThrow("HTTPS");
  expect(f.set).not.toHaveBeenCalled();
});
it("keeps legacy uploaded resume applications working", async () => {
  await applyToOpportunity(
    { uid: "alice" },
    {
      name: "Alice",
      college: "College",
      resumePath: "resumes/alice/resume.pdf",
    },
    { id: "op1" },
    "",
  );
  expect(f.set).toHaveBeenCalledWith(
    "applications/alice_op1",
    expect.objectContaining({
      resumePath: "resumes/alice/resume.pdf",
      resumeUrl: "",
    }),
  );
});
