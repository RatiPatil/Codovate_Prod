import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HackathonDirectory } from "./HackathonDirectory.jsx";
import { hackathonDirectory, filterHackathonDirectory, directoryStatus } from "./hackathonCatalog.js";
afterEach(cleanup);
it("preserves source groups and never invents edition dates or money", () => {
  expect(hackathonDirectory).toHaveLength(76);
  expect(new Set(hackathonDirectory.map(row => row.group)).size).toBe(7);
  expect(new Set(hackathonDirectory.map(row => row.id)).size).toBe(76);
  for (const row of hackathonDirectory) {
    expect(row.deadline).toBeNull();
    expect(row.prizeINR).toBeNull();
    expect(directoryStatus(row)).toBe("unverified");
  }
});
it("combines mode, interest, section and search filters", () => {
  const rows = filterHackathonDirectory(hackathonDirectory, {mode:"Remote",category:"Finance",group:"Tech Company Hackathons",search:"PayPal"});
  expect(rows.map(row => row.title)).toEqual(["PayPal Hackathons"]);
  expect(filterHackathonDirectory(hackathonDirectory, {availability:"open"})).toEqual([]);
  expect(filterHackathonDirectory(hackathonDirectory, {availability:"upcoming"})).toEqual([]);
  expect(filterHackathonDirectory(hackathonDirectory, {mode:"Hybrid"}).map(row => row.title)).toEqual(["Microsoft Imagine Cup"]);
});
it("computes closed and coming-soon states from explicit timestamps and ranks only known amounts", () => {
  const now=Date.parse("2026-11-11T12:00:00Z");
  const base=hackathonDirectory[0];
  const upcoming={...base,registrationOpensAt:"2026-12-01T00:00:00Z",deadline:"2027-01-01T00:00:00Z"};
  expect(directoryStatus(upcoming,now)).toBe("upcoming");
  expect(directoryStatus({...upcoming,registrationOpensAt:"2026-11-01T00:00:00Z"},now)).toBe("open");
  expect(directoryStatus({...upcoming,deadline:"2026-11-11T12:00:00Z"},now)).toBe("closed");
  const rows=[{...base,id:"unknown"},{...base,id:"known",prizeINR:10000},{...base,id:"zero",prizeINR:0}];
  expect(filterHackathonDirectory(rows,{sort:"stipend"},now).map(row=>row.id)).toEqual(["known","zero","unknown"]);
});
it("labels reference resources separately and applies passed filters to links", () => {
  render(<HackathonDirectory filters={{search:"NASA"}} />);
  expect(screen.getByRole("heading",{name:"NASA Space Apps Challenge"})).toBeInTheDocument();
  expect(screen.queryByRole("heading",{name:"HackMIT"})).toBeNull();
  expect(screen.getByText("Dates not announced / verify edition")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Visit NASA/})).toHaveAttribute("rel","noopener noreferrer");
});
