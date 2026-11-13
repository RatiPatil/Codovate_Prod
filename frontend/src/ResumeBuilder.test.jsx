import { afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
vi.mock("./session", () => ({
  useSession: () => ({
    user: { uid: "alice", email: "alice@example.com" },
    profile: { name: "Alice", college: "Regional College", skills: ["React"] },
    loading: false,
  }),
}));
import { ResumeBuilder } from "./ResumeBuilder";
import {
  resumeHtml,
  resumeFromProfile,
  documentResumeTemplates,
  originalResumeUrl,
} from "./resumeTemplates";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("fills saved profile fields and switches templates", () => {
  render(<ResumeBuilder />);
  expect(screen.getByLabelText("Full name").value).toBe("Alice");
  expect(screen.getByLabelText("Education").value).toBe("Regional College");
  fireEvent.click(
    screen.getByRole("button", { name: "Use technical projects" }),
  );
  expect(
    screen.getByRole("button", { name: "Use technical projects" }),
  ).toHaveAttribute("aria-pressed", "true");
});
it("downloads an editable document with the current inputs", () => {
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  URL.createObjectURL = vi.fn(() => "blob:resume");
  URL.revokeObjectURL = vi.fn();
  render(<ResumeBuilder />);
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Alice Updated" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Download editable résumé" }),
  );
  expect(click).toHaveBeenCalledOnce();
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(screen.getByRole("status")).toHaveTextContent("Save as PDF");
});
it("escapes all user content without generating scripts or external assets", () => {
  const html = resumeHtml({
    name: '<script>alert("x")</script>',
    projects: "<img src=x onerror=alert(1)>",
    summary: "A & B",
  });
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("<img");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("A &amp; B");
  expect(html).toContain('contenteditable="true"');
});
it("orders templates meaningfully and omits empty sections", () => {
  const d = {
    name: "Student",
    skills: "React",
    education: "College",
    projects: "App",
    experience: "Internship",
  };
  expect(resumeHtml(d, "technical").indexOf("<h2>Projects")).toBeLessThan(
    resumeHtml(d, "technical").indexOf("<h2>Education"),
  );
  expect(resumeHtml(d, "experience").indexOf("<h2>Experience")).toBeLessThan(
    resumeHtml(d, "experience").indexOf("<h2>Projects"),
  );
  expect(resumeHtml(d)).not.toContain("<h2>Achievements");
  expect(() => resumeHtml(d, "invalid")).toThrow();
  expect(resumeFromProfile().skills).toBe("");
  expect(resumeFromProfile(null, "guest@example.test").email).toBe(
    "guest@example.test",
  );
});

it("provides all eight original editable Word documents with matching source links", () => {
  expect(documentResumeTemplates).toHaveLength(8);
  expect(new Set(documentResumeTemplates.map((t) => t.driveId)).size).toBe(8);
  render(<ResumeBuilder />);
  for (const template of documentResumeTemplates) {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Use " + template.name.toLowerCase(),
      }),
    );
    expect(
      screen.getByRole("link", { name: "Preview original" }),
    ).toHaveAttribute("href", originalResumeUrl(template));
    expect(
      screen.getByRole("link", {
        name: `Download editable Word (${template.fileType})`,
      }),
    ).toHaveAttribute("href", originalResumeUrl(template, true));
    expect(screen.getByLabelText("Full name")).toHaveValue("Alice");
    const html = resumeHtml(
      { name: "Alice", projects: "My project", certifications: "Credential" },
      template.id,
    );
    expect(html).toContain("My project");
    expect(html).toContain("Credential");
    expect(html).toContain('contenteditable="true"');
  }
});
it("updates live preview with personal edits and keeps preview read-only", () => {
  render(<ResumeBuilder />);
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Updated Student" },
  });
  const preview = screen.getByTitle("Résumé preview");
  expect(preview.getAttribute("srcdoc")).toContain("Updated Student");
  expect(preview.getAttribute("srcdoc")).toContain('contenteditable="false"');
  expect(preview).toHaveAttribute("sandbox", "");
});
