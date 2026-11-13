import { it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResumeBuilder } from "./ResumeBuilder";
import { documentResumeTemplates, originalResumeUrl } from "./resumeTemplates";
afterEach(cleanup);
it("shows only eight original Word templates with document previews and downloads", () => {
  render(<ResumeBuilder />);
  expect(screen.getAllByRole("article")).toHaveLength(8);
  expect(screen.getAllByRole("link", { name: "Download Word" })).toHaveLength(
    8,
  );
  for (const template of documentResumeTemplates)
    expect(
      screen.getByTitle(template.name + " template preview"),
    ).toHaveAttribute(
      "src",
      `https://drive.google.com/file/d/${template.driveId}/preview`,
    );
  expect(screen.queryByLabelText("Full name")).toBeNull();
  expect(screen.queryByRole("button", { name: /Use / })).toBeNull();
  expect(screen.queryByRole("form")).toBeNull();
  expect(
    screen.getAllByRole("link", { name: "Download Word" })[0],
  ).toHaveAttribute(
    "href",
    originalResumeUrl(documentResumeTemplates[0], true),
  );
});
