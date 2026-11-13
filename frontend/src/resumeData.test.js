import { beforeEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {}, storage: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_, c, id) => `${c}/${id}`,
  serverTimestamp: () => "SERVER",
  runTransaction: (_, fn) => fn(mock),
}));
vi.mock("firebase/storage", () => ({
  ref: (_, path) => path,
  uploadBytesResumable: (...args) => mock.upload(...args),
  getDownloadURL: async () => "https://files.example/saved.pdf",
}));
import { saveResume, validateResumePdf, resumeDownloadUrl } from "./resumeData";
const pdf = {
  name: "resume.pdf",
  size: 100,
  type: "application/pdf",
  slice: () => ({ text: async () => "%PDF-" }),
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ resumeUrl: "https://old.example/resume" }),
  });
  mock.upload.mockImplementation(() => ({
    cancel: mock.cancel,
    on: (_, progress, error, complete) => {
      progress({ bytesTransferred: 100, totalBytes: 100 });
      complete();
    },
  }));
});
it("uploads a PDF and only then saves its private path while clearing the stale link", async () => {
  const progress = vi.fn();
  await saveResume("alice", { mode: "pdf", file: pdf }, progress);
  expect(mock.upload).toHaveBeenCalledWith("resumes/alice/resume.pdf", pdf, {
    contentType: "application/pdf",
  });
  expect(mock.update).toHaveBeenCalledWith("users/alice", {
    resumePath: "resumes/alice/resume.pdf",
    resumeUrl: "",
    updatedAt: "SERVER",
  });
  expect(progress).toHaveBeenCalledWith(100);
});
it("saves a link independently of uploads and unrelated profile fields", async () => {
  await saveResume("alice", {
    mode: "link",
    url: "https://provider.example/resume",
  });
  expect(mock.upload).not.toHaveBeenCalled();
  expect(mock.update).toHaveBeenCalledWith("users/alice", {
    resumeUrl: "https://provider.example/resume",
    updatedAt: "SERVER",
  });
});
it("rejects empty, oversized and disguised PDFs before uploading", async () => {
  for (const file of [
    { ...pdf, size: 0 },
    { ...pdf, size: 5242881 },
    { ...pdf, name: "resume.docx" },
    { ...pdf, slice: () => ({ text: async () => "<html" }) },
  ])
    await expect(validateResumePdf(file)).rejects.toThrow();
  expect(mock.upload).not.toHaveBeenCalled();
});
it("an upload failure cannot save an unusable profile path", async () => {
  mock.upload.mockImplementation(() => ({
    cancel: mock.cancel,
    on: (_, p, err) => err({ code: "storage/unauthorized" }),
  }));
  await expect(
    saveResume("alice", { mode: "pdf", file: pdf }),
  ).rejects.toMatchObject({ code: "storage/unauthorized" });
  expect(mock.update).not.toHaveBeenCalled();
});
it("a failed metadata write is reported instead of announcing success", async () => {
  mock.update.mockImplementationOnce(() => {
    throw Object.assign(new Error("Denied"), { code: "permission-denied" });
  });
  await expect(
    saveResume("alice", {
      mode: "link",
      url: "https://provider.example/resume",
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("uses the saved link when present and otherwise opens the saved PDF", async () => {
  expect(
    await resumeDownloadUrl({
      resumeUrl: "https://provider.example/resume",
      resumePath: "resumes/alice/resume.pdf",
    }),
  ).toBe("https://provider.example/resume");
  expect(
    await resumeDownloadUrl({ resumePath: "resumes/alice/resume.pdf" }),
  ).toBe("https://files.example/saved.pdf");
});
