import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CareerPortals, CompanyLogo } from "./CareerPortals";
import groups from "./careerPortals.json";
afterEach(cleanup);
it("filters company and role results together with the industry", () => {
  render(<CareerPortals />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "OpenAI" } });
  expect(screen.getByRole("link", { name: /Visit OpenAI careers/ })).toHaveAttribute("href", "https://openai.com/careers/");
  expect(screen.queryByRole("heading", { name: "Google" })).toBeNull();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Indian Banks & NBFCs" } });
  expect(screen.getByText("No matching companies")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByRole("heading", { name: "Google" })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "VLSI" } });
  expect(screen.getByRole("heading", { name: "Qualcomm" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Google" })).toBeNull();
});
it("keeps external links safe and identifies unconfirmed destinations", () => {
  render(<CareerPortals />);
  for (const link of screen.getAllByRole("link")) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(new URL(link.href).protocol).toBe("https:");
  }
  expect(screen.getByText("Career link pending verification")).toBeInTheDocument();
  expect(groups).toHaveLength(19);
  for (const group of groups) expect(new Set(group.companies.map(c => c.name)).size).toBe(group.companies.length);
});
it("introduces every listed company and makes its business searchable", () => {
  for (const group of groups) for (const company of group.companies) {
    expect(company.description.length).toBeGreaterThan(50);
    expect(company.description.length).toBeLessThan(300);
  }
  render(<CareerPortals />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "robotic vacuum" } });
  expect(screen.getByRole("heading", { name: "iRobot" })).toBeInTheDocument();
  expect(screen.getByText(groups.flatMap(group=>group.companies).find(company=>company.name==="iRobot").description)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Google" })).toBeNull();
});

it("falls back to company initials when an official asset fails to load", () => {
  const {container}=render(<CompanyLogo company={{name:"Example Company",logo:"/company-logos/example.png"}} />);
  const img=container.querySelector("img");
  expect(img).toHaveAttribute("loading","lazy");
  fireEvent.error(img);
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("EC")).toBeInTheDocument();
});
