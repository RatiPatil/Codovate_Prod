import { afterEach, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExternalDetails } from "./ExternalDetails";
import { externalById } from "./externalCatalog";
afterEach(cleanup);
it("uses the standard detail layout with an official application and no internal submission", () => {
  render(
    <MemoryRouter>
      <ExternalDetails item={externalById("stripe-8031833")} />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Software Engineer, Intern" }),
  ).toBeInTheDocument();
  const link = screen.getByRole("link", {
    name: /Apply on official website|Check original listing/,
  });
  expect(link).toHaveAttribute(
    "href",
    expect.stringContaining("stripe.com/careers/listing"),
  );
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getByText(/Codovate does not submit/)).toBeInTheDocument();
});
