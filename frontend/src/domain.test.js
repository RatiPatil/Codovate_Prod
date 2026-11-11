import { describe, it, expect } from "vitest";
import {
  filterOpportunities,
  skillInputError,
  isOpen,
  completion,
  validWebLink,
} from "./domain";
const items = [
  {
    id: "a",
    title: "React intern",
    organization: "Studio",
    type: "internship",
    mode: "Remote",
    category: "Technology",
    skills: ["JavaScript"],
    status: "published",
    deadline: "2099-01-01",
    stipend: 1000,
  },
  {
    id: "b",
    title: "Designer",
    organization: "Lab",
    type: "job",
    mode: "On-site",
    category: "Design",
    skills: ["Figma"],
    status: "published",
    deadline: "2099-02-01",
    stipend: 2000,
  },
  {
    id: "c",
    title: "Expired",
    organization: "Studio",
    type: "internship",
    skills: [],
    status: "published",
    deadline: "2020-01-01",
    stipend: 5000,
  },
];
describe("opportunity discovery", () => {
  it("combines type, skill, work mode and category filters", () =>
    expect(
      filterOpportunities(items, {
        search: "javascript",
        type: "internship",
        mode: "Remote",
        category: "Technology",
      }).map((o) => o.id),
    ).toEqual(["a"]));
  it("excludes closed, expired and invalid-deadline records", () => {
    expect(filterOpportunities(items).length).toBe(2);
    expect(isOpen({ ...items[0], status: "closed" })).toBe(false);
    expect(isOpen({ ...items[0], deadline: "invalid" })).toBe(false);
  });
  it("sorts by stipend and deadline", () => {
    expect(
      filterOpportunities(items, { sort: "stipend" }).map((o) => o.id),
    ).toEqual(["b", "a"]);
    expect(
      filterOpportunities(items, { sort: "deadline" }).map((o) => o.id),
    ).toEqual(["a", "b"]);
  });
  it("returns an empty result when filters do not match", () =>
    expect(filterOpportunities(items, { search: "Python" })).toEqual([]));
});
describe("student profile", () => {
  it("computes completion from substantive fields", () => {
    expect(completion()).toBe(0);
    expect(completion(null)).toBe(0);
    expect(completion({ name: "A", skills: [] })).toBe(13);
    expect(
      completion({
        name: "A",
        college: "B",
        degree: "C",
        graduationYear: "2027",
        city: "Pune",
        bio: "About",
        skills: ["React"],
        resumePath: "resumes/id/resume.pdf",
      }),
    ).toBe(100);
  });
  it("accepts only secure portfolio links", () => {
    expect(validWebLink("")).toBe(true);
    expect(validWebLink("https://github.com/student")).toBe(true);
    expect(validWebLink("javascript:alert(1)")).toBe(false);
    expect(validWebLink("http://example.com")).toBe(false);
  });
});

describe("skill input validation", () => {
  it("explains schema limits before saving", () => {
    expect(skillInputError("React, React")).toBe("");
    expect(skillInputError("x".repeat(61))).toMatch(/61/);
    expect(
      skillInputError(
        Array.from({ length: 21 }, (_, i) => "Skill" + i).join(","),
      ),
    ).toMatch(/20/);
  });
});

describe("authoritative application deadline", () => {
  it("uses Firestore closesAt before a conflicting display deadline", () => {
    const listing = {
      status: "published",
      deadline: "2099-01-01",
      closesAt: { seconds: 1000 },
    };
    expect(isOpen(listing, 2000000)).toBe(false);
    expect(
      isOpen({ ...listing, closesAt: { toMillis: () => 3000000 } }, 2000000),
    ).toBe(true);
  });
});

it("a resume link contributes to profile completion like a PDF path", () => {
  const core = {
    name: "Alice",
    college: "College",
    degree: "B.Tech",
    graduationYear: "2028",
    city: "Pune",
    bio: "Student",
    skills: ["React"],
  };
  expect(completion({ ...core, resumeUrl: "https://example.com/resume" })).toBe(
    100,
  );
  expect(completion({ ...core, resumePath: "resumes/alice/resume.pdf" })).toBe(
    100,
  );
});
it("allows closed event discovery only when requested and keeps unknown compensation last", () => {
  expect(filterOpportunities(items,{type:"internship",openOnly:false,availability:"closed"}).map(row=>row.id)).toEqual(["c"]);
  expect(filterOpportunities([...items,{...items[0],id:"unknown",stipend:null}],{sort:"stipend"}).map(row=>row.id)).toEqual(["b","a","unknown"]);
  expect(filterOpportunities(items,{sort:"deadline",openOnly:false}).map(row=>row.id)).toEqual(["a","b","c"]);
});
