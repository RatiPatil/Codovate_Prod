import { it, expect } from "vitest";
import {
  teamInput,
  teamStatus,
  teamSnapshot,
  teamListing,
} from "./projectTeamDomain";
const record = {
  ownerId: "alice",
  title: "Studio",
  description: "Original student project",
  requiredSkills: ["React"],
  capacity: 2,
  recruitment: "recruiting",
  lifecycle: "active",
  members: ["alice"],
  roles: { alice: "leader" },
  version: 1,
  createdAt: "PRIVATE",
  historyId: "revision",
};
it("validates team capacity and required skills before a write", () => {
  expect(
    teamInput({ ...record, requiredSkills: "React, React, Python" })
      .requiredSkills,
  ).toEqual(["React", "Python"]);
  for (const capacity of [1, 13, 2.5])
    expect(() => teamInput({ ...record, capacity })).toThrow();
  expect(() => teamInput({ ...record, description: "" })).toThrow();
});
it("derives Full status from actual membership and preserves Closed precedence", () => {
  expect(teamStatus(record)).toBe("Recruiting");
  expect(teamStatus({ ...record, members: ["alice", "bob"] })).toBe("Full");
  expect(
    teamStatus({ ...record, recruitment: "closed", members: ["alice", "bob"] }),
  ).toBe("Closed");
});
it("public listing omits private membership and role maps", () => {
  const listing = teamListing("studio", record, "SERVER");
  expect(listing.memberCount).toBe(1);
  expect(listing).not.toHaveProperty("members");
  expect(listing).not.toHaveProperty("roles");
  expect(listing).not.toHaveProperty("historyId");
  expect(teamSnapshot(record)).toMatchObject({
    members: ["alice"],
    roles: { alice: "leader" },
    version: 1,
  });
  expect(teamSnapshot(record)).not.toHaveProperty("createdAt");
});
