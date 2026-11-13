import { it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({ set: vi.fn(), remove: vi.fn() }));
vi.mock("./firebase", () => ({ db: {}, configured: true }));
vi.mock("firebase/firestore", async () => ({
  ...(await vi.importActual("firebase/firestore")),
  doc: (_, c, id) => `${c}/${id}`,
  setDoc: mock.set,
  deleteDoc: mock.remove,
  serverTimestamp: () => "SERVER",
}));
import { toggleSaved } from "./data";
it("persists official metadata privately without requiring a managed listing", async () => {
  await toggleSaved(
    "alice",
    {
      id: "job1",
      title: "Developer",
      organization: "Employer",
      type: "job",
      external: true,
      sourceUrl: "https://employer.example/careers/1",
    },
    false,
  );
  expect(mock.set).toHaveBeenCalledWith("bookmarks/alice_job1", {
    studentId: "alice",
    opportunityId: "job1",
    title: "Developer",
    organization: "Employer",
    type: "job",
    source: "external",
    sourceUrl: "https://employer.example/careers/1",
    createdAt: "SERVER",
  });
});
it("saves an undated hackathon reference without inventing a source URL", async () => {
  await toggleSaved(
    "alice",
    {
      id: "directory-series",
      title: "Series",
      organization: "Hackathon reference",
      type: "hackathon",
      bookmarkSource: "directory",
    },
    false,
  );
  expect(mock.set).toHaveBeenLastCalledWith(
    "bookmarks/alice_directory-series",
    expect.objectContaining({ source: "directory", sourceUrl: "" }),
  );
});
it("removes a bookmark using the owner-prefixed ID", async () => {
  await toggleSaved("alice", { id: "job1" }, true);
  expect(mock.remove).toHaveBeenCalledWith("bookmarks/alice_job1");
});
it("rejects unsafe official URLs before writing", async () => {
  await expect(
    toggleSaved(
      "alice",
      { id: "unsafe", external: true, sourceUrl: "javascript:alert(1)" },
      false,
    ),
  ).rejects.toThrow("HTTPS");
});
