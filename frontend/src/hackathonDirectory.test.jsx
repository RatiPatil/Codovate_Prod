import { MemoryRouter } from "react-router-dom";
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
    expect(row.schedule.checkedOn).toBe("2026-11-11");
    if (row.schedule.eventStartDate) expect(row.schedule.sourceUrl).toMatch(/^https:/);
  }
});
it("combines mode, interest, section and search filters", () => {
  const rows = filterHackathonDirectory(hackathonDirectory, {mode:"Remote",category:"Finance",group:"Tech Company Hackathons",search:"PayPal"});
  expect(rows.map(row => row.title)).toEqual(["PayPal Hackathons"]);
  expect(filterHackathonDirectory(hackathonDirectory, {availability:"open"}, Date.parse("2026-11-11T12:00:00Z")).some(row => row.id === "pennapps")).toBe(true);
  expect(filterHackathonDirectory(hackathonDirectory, {availability:"upcoming"}, Date.parse("2026-11-11T12:00:00Z")).some(row => row.id === "mchacks")).toBe(true);
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
  render(<MemoryRouter><HackathonDirectory filters={{search:"NASA"}} /></MemoryRouter>);
  expect(screen.getByRole("heading",{name:"NASA Space Apps Challenge"})).toBeInTheDocument();
  expect(screen.queryByRole("heading",{name:"HackMIT"})).toBeNull();
  expect(screen.getByRole("link", {name:/Date source/})).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Visit NASA/})).toHaveAttribute("rel","noopener noreferrer");
});

it("distinguishes event dates, closed applications, partial announcements and stale open observations", () => {
  const now=Date.parse("2026-11-11T12:00:00Z");
  const get=id=>hackathonDirectory.find(row=>row.id===id);
  expect(directoryStatus(get("hackprinceton"),now)).toBe("closed");
  expect(directoryStatus(get("global-game-jam"),now)).toBe("upcoming");
  expect(directoryStatus(get("mhacks"),now)).toBe("closed");
  expect(directoryStatus(get("dandyhacks"),now)).toBe("unverified");
  expect(directoryStatus(get("treehacks"),now)).toBe("open");
  expect(directoryStatus(get("treehacks"),Date.parse("2026-11-20T12:00:00Z"))).toBe("upcoming");
  const ranked=filterHackathonDirectory(hackathonDirectory,{sort:"eventDate"},now);
  expect(ranked.findIndex(row=>row.id==="hackprinceton")).toBeLessThan(ranked.findIndex(row=>row.id==="treehacks"));
});
