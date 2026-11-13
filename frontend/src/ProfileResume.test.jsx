import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
const fake = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("./resumeData", () => ({
  saveResume: fake.save,
  resumeDownloadUrl: vi.fn(),
  resumeError: (e) => e.message,
}));
import ProfileResume from "./ProfileResume";
const user = { uid: "alice" };
beforeEach(() => {
  fake.save.mockReset();
});
afterEach(cleanup);
it("provides an independent save action and rehydrates the saved link", async () => {
  fake.save.mockResolvedValue({ resumeUrl: "https://provider.example/resume" });
  const { rerender } = render(<ProfileResume user={user} profile={{}} />);
  fireEvent.click(screen.getByRole("button", { name: "Use résumé link" }));
  fireEvent.change(screen.getByLabelText("HTTPS résumé link"), {
    target: { value: "https://provider.example/resume" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save résumé" }));
  await screen.findByText("Your résumé link has been saved to your profile.");
  expect(fake.save).toHaveBeenCalledWith(
    "alice",
    expect.objectContaining({
      mode: "link",
      url: "https://provider.example/resume",
    }),
    expect.any(Function),
  );
  rerender(
    <ProfileResume
      user={user}
      profile={{ resumeUrl: "https://provider.example/resume" }}
    />,
  );
  expect(screen.getByText("Saved résumé link")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /View current résumé/ }),
  ).toBeInTheDocument();
});
it("keeps the selected PDF for retry when saving fails", async () => {
  fake.save.mockRejectedValue(new Error("Upload failed"));
  render(<ProfileResume user={user} profile={{}} />);
  const file = new File(["%PDF-1.4\ncontent"], "my-resume.pdf", {
    type: "application/pdf",
  });
  fireEvent.change(screen.getByLabelText("Résumé PDF"), {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save résumé" }));
  await screen.findByRole("alert");
  expect(screen.getByText("my-resume.pdf")).toBeInTheDocument();
  expect(
    screen.queryByText(/has been uploaded and saved/),
  ).not.toBeInTheDocument();
});
it("requires a selected PDF and reports completed uploads accurately", async () => {
  fake.save.mockResolvedValue({
    resumePath: "resumes/alice/resume.pdf",
    resumeUrl: "",
  });
  render(<ProfileResume user={user} profile={{}} />);
  expect(screen.getByRole("button", { name: "Save résumé" })).toBeDisabled();
  const file = new File(["%PDF-1.4"], "resume.pdf", {
    type: "application/pdf",
  });
  fireEvent.change(screen.getByLabelText("Résumé PDF"), {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save résumé" }));
  await screen.findByText(
    "Your PDF résumé has been uploaded and saved to your profile.",
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save résumé" })).toBeDisabled(),
  );
});
