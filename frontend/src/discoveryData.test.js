import { it, expect, vi, beforeEach } from "vitest";
const fake = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => p.join("/"),
  serverTimestamp: () => "SERVER",
  runTransaction: async (_db, fn) =>
    fn({ get: fake.get, set: fake.set, update: fake.update }),
  collection: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
import {
  emptyDetails,
  discoveryDetails,
  discoverPeers,
  matchReasons,
  saveDiscovery,
  dismissPeer,
  ensureDefaultDiscovery,
} from "./discoveryData";
beforeEach(() => {
  vi.clearAllMocks();
});
it("optional details discard private fields and validate explicit inputs", () => {
  const details = discoveryDetails({
    ...emptyDetails,
    email: "private@example.com",
    mobile: "9999999999",
    desiredRole: " Frontend Developer ",
    achievements: "Student project,Student project",
  });
  expect(details.desiredRole).toBe("Frontend Developer");
  expect(details.achievements).toEqual(["Student project"]);
  expect(details).not.toHaveProperty("email");
  expect(details).not.toHaveProperty("mobile");
  expect(() =>
    discoveryDetails({
      ...emptyDetails,
      photoUrl: "https://example.com/image",
    }),
  ).toThrow();
  expect(() =>
    discoveryDetails({ ...emptyDetails, experience: "Expert guess" }),
  ).toThrow();
});
it("combines filters, persistent dismissals and blocked connections", () => {
  const items = [
    { uid: "alice", name: "Alice", skills: ["React"] },
    {
      uid: "bob",
      name: "Bob",
      skills: ["React"],
      details: { domain: "Web Development", experience: "Beginner" },
    },
    {
      uid: "carol",
      name: "Carol",
      skills: ["Python"],
      details: { domain: "AI/ML", experience: "Advanced" },
    },
  ];
  expect(
    discoverPeers(items, {
      uid: "alice",
      skill: "react",
      domain: "Web Development",
      experience: "Beginner",
    }).map((p) => p.uid),
  ).toEqual(["bob"]);
  expect(
    discoverPeers(items, {
      uid: "alice",
      dismissed: ["bob"],
      blocked: ["carol"],
    }),
  ).toEqual([]);
});
it("suggestions explain matches without inventing percentages or interests", () => {
  const mine = {
      skills: ["React"],
      details: {
        domain: "Web Development",
        passions: ["Open Source"],
        college: "Example College",
      },
    },
    p = {
      uid: "bob",
      name: "Bob",
      skills: ["React"],
      details: {
        domain: "Web Development",
        passions: ["Open Source"],
        college: "example college",
      },
    };
  expect(matchReasons(mine, p)).toEqual([
    "1 shared skill",
    "Same domain",
    "Similar interests",
    "Same college",
  ]);
  expect(
    discoverPeers([p], { uid: "alice", suggested: true, mine }).length,
  ).toBe(1);
  expect(
    discoverPeers([p], { uid: "alice", suggested: true, mine: {} }),
  ).toEqual([]);
});
it("withdrawing extra-field consent preserves private preferences and strips public extras", async () => {
  fake.get.mockResolvedValue({ exists: () => true });
  await saveDiscovery(
    { uid: "alice" },
    { name: "Alice", skills: ["React"], email: "private@example.com" },
    { ...emptyDetails, college: "Private College" },
    false,
  );
  expect(fake.set.mock.calls[0][1].details.college).toBe("Private College");
  expect(fake.set.mock.calls[1][1]).not.toHaveProperty("details");
  expect(fake.set.mock.calls[1][1]).not.toHaveProperty("email");
});
it("restoring a dismissed profile updates state without replacing its original timestamp", async () => {
  fake.get.mockResolvedValue({ exists: () => true });
  await dismissPeer("alice", "bob", false);
  expect(fake.update).toHaveBeenCalledWith(
    "discoveryDismissals/alice/members/bob",
    { dismissed: false, updatedAt: "SERVER" },
  );
  expect(fake.set).not.toHaveBeenCalled();
});

it("scores shared profile evidence, including a genuine 95 percent match", async () => {
  const { profileMatch } = await import("./discoveryData");
  const mine = {
    skills: ["React"],
    details: {
      domain: "AI/ML",
      passions: ["Open Source"],
      seeking: ["Project Collaborators"],
      college: "Example College",
      year: "Final year",
      experience: "Beginner",
    },
  };
  const other = {
    skills: ["React"],
    details: { ...mine.details, year: "Third year" },
  };
  expect(profileMatch(mine, other)).toEqual({
    score: 95,
    labels: ["AI/ML Match"],
  });
  expect(profileMatch({}, {}).score).toBe(0);
  expect(profileMatch({ skills: ["React"] }, { skills: ["React"] }).score).toBe(
    30,
  );
});
it("uses exact canonical skills and combines comma-separated filters", () => {
  const items = [
    {
      uid: "js",
      name: "JS Student",
      skills: ["JavaScript", "React.js"],
      details: {},
    },
    {
      uid: "java",
      name: "Java Student",
      skills: ["Java", "Python"],
      details: {},
    },
    {
      uid: "ml",
      name: "ML Student",
      skills: ["Machine Learning", "Python"],
      details: { college: "Regional College" },
    },
  ];
  expect(
    discoverPeers(items, { uid: "me", skill: "Java" }).map((p) => p.uid),
  ).toEqual(["java"]);
  expect(
    discoverPeers(items, { uid: "me", skill: "ML, Python" }).map((p) => p.uid),
  ).toEqual(["ml"]);
  expect(
    discoverPeers(items, { uid: "me", skill: "React" }).map((p) => p.uid),
  ).toEqual(["js"]);
  expect(
    discoverPeers(items, { uid: "me", search: "Regional College" }).map(
      (p) => p.uid,
    ),
  ).toEqual(["ml"]);
});
it("prefills discovery from onboarding while respecting explicitly cleared saved values", async () => {
  const { discoveryDraft } = await import("./discoveryData");
  const profile = {
    college: "Regional College",
    degree: "MCA",
    city: "Solapur",
    careerPreferences: {
      desiredRole: "AI Engineer",
      domain: "AI/ML",
      yearOfStudy: "Final year",
      seeking: ["Project Collaborators"],
    },
    teammateCard: {
      photoUrl: "",
      achievements: ["SIH Participant"],
      passions: ["Open Source"],
    },
  };
  expect(discoveryDraft(profile, {}, null)).toMatchObject({
    desiredRole: "AI Engineer",
    degree: "MCA",
    college: "Regional College",
    achievements: ["SIH Participant"],
    passions: ["Open Source"],
  });
  expect(
    discoveryDraft(profile, {}, { ...emptyDetails, desiredRole: "" }),
  ).toMatchObject({ desiredRole: "", degree: "" });
  expect(
    discoveryDraft(profile, {}, { desiredRole: "Researcher" }).degree,
  ).toBe("MCA");
});

it("defaults existing students to discoverable and preserves an explicit private choice", async () => {
  fake.get
    .mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ discoverable: false }),
    })
    .mockResolvedValueOnce({ exists: () => false });
  await ensureDefaultDiscovery({ uid: "alice" }, { name: "Alice", skills: [] });
  expect(fake.set).not.toHaveBeenCalled();
  fake.get
    .mockResolvedValueOnce({ exists: () => false, data: () => undefined })
    .mockResolvedValueOnce({ exists: () => false });
  await ensureDefaultDiscovery({ uid: "alice" }, { name: "Alice", skills: [] });
  expect(fake.set).toHaveBeenCalledWith(
    "discoveryPreferences/alice",
    expect.objectContaining({ discoverable: true }),
  );
  expect(fake.set).toHaveBeenCalledWith(
    "memberProfiles/alice",
    expect.objectContaining({ name: "Alice", skills: [] }),
  );
});

it("program suggestions are searchable without becoming confirmed-skill match scores", () => {
  const candidate = {
    uid: "bob",
    name: "Bob",
    skills: [],
    suggestedSkills: ["React"],
    details: {},
  };
  expect(
    discoverPeers([candidate], { uid: "alice", skill: "React" }),
  ).toHaveLength(1);
  expect(
    discoverPeers([candidate], {
      uid: "alice",
      suggested: true,
      mine: { skills: ["React"], details: {} },
    }),
  ).toHaveLength(0);
});

it("matches canonical study fields without inferring private academic data", () => {
  const peers = [
    {
      uid: "one",
      name: "One",
      skills: [],
      details: { fieldOfStudy: "MECHANICAL ENGINEERING" },
    },
    {
      uid: "two",
      name: "Two",
      skills: [],
      details: { fieldOfStudy: "COMPUTER SCIENCE AND ENGINEERING" },
    },
    { uid: "three", name: "Three", skills: [], details: {} },
  ];
  expect(
    discoverPeers(peers, {
      uid: "me",
      fieldOfStudy: " mechanical   engineering ",
    }).map((p) => p.uid),
  ).toEqual(["one"]);
  expect(
    discoverPeers(peers, { uid: "me", search: "mechanical" }).map((p) => p.uid),
  ).toEqual(["one"]);
});

it("matches student searches and combined skills regardless of letter case", () => {
  const people = [
    {
      uid: "peer",
      name: "VIVEK CHAVAN",
      skills: ["React.js", "Python"],
      details: { desiredRole: "AI Engineer" },
    },
  ];
  for (const search of [
    "vivek chavan",
    "VIVEK CHAVAN",
    "ViVeK   ChAvAn",
    "ai ENGINEER",
  ]) {
    expect(
      discoverPeers(people, { uid: "me", search }).map((p) => p.uid),
    ).toEqual(["peer"]);
  }
  for (const skill of ["react, python", "REACT, PYTHON", "ReAcT, pYtHoN"]) {
    expect(
      discoverPeers(people, { uid: "me", skill }).map((p) => p.uid),
    ).toEqual(["peer"]);
  }
  expect(discoverPeers(people, { uid: "me", skill: "Java" })).toEqual([]);
});
