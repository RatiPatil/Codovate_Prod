import { describe, it, expect } from "vitest";
import { taskInput, resourceInput } from "./careerData";
describe("career document validation", () => {
  it("normalizes a private task before writing", () =>
    expect(
      taskInput(" Practice interviews ", " A focused note ", "2027-01-01"),
    ).toEqual({
      title: "Practice interviews",
      note: "A focused note",
      dueDate: "2027-01-01",
    }));
  it("rejects empty goals, oversized notes and invalid dates", () => {
    expect(() => taskInput("", "", "2027-01-01")).toThrow();
    expect(() => taskInput("Goal", "x".repeat(1001), "2027-01-01")).toThrow();
    expect(() => taskInput("Goal", "", "not-a-date")).toThrow();
    expect(() => taskInput("Goal", "", "2027-02-31")).toThrow();
  });
  it("accepts a curated HTTPS resource", () =>
    expect(
      resourceInput({
        title: " Mock interview ",
        description: "Practice aloud",
        url: "https://example.com/interview",
        category: "Interview prep",
        status: "draft",
      }).title,
    ).toBe("Mock interview"));
  it("blocks unsafe resource links and unknown visibility", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://user:password@example.com",
      "not-a-url",
    ])
      expect(() =>
        resourceInput({
          title: "x",
          description: "x",
          url,
          category: "Interview prep",
          status: "draft",
        }),
      ).toThrow();
    expect(() =>
      resourceInput({
        title: "x",
        description: "x",
        url: "https://example.com",
        category: "Interview prep",
        status: "hidden",
      }),
    ).toThrow();
  });
});
