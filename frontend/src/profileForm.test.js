import { it, expect } from "vitest";
import { validatedProfileForm } from "./profileForm";
const form = () => {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    name: "Student Middle Patil",
    college: "Example College",
    degree: "MCA",
    city: "Solapur",
    graduationYear: "2027",
    bio: "Building useful projects",
    portfolio: "https://github.com/student",
    skills: "React, react, SQL",
    mobile: "9999999999",
    mobileVisibility: "only_me",
    desiredRole: "Frontend developer",
    domain: "Web Development",
    experience: "Beginner",
    yearOfStudy: "Second year",
    availability: "1-5 hours/week",
    mode: "Remote",
  }))
    f.set(k, v);
  f.append("goals", "Jobs");
  f.append("passions", "Open Source");
  return f;
};
it("normalizes uppercase names, whitespace and case-insensitive duplicate skills", () => {
  const f = form();
  f.set("college", "  Example   College ");
  const { data } = validatedProfileForm(f);
  expect(data.name).toBe("STUDENT MIDDLE PATIL");
  expect(data.college).toBe("Example College");
  expect(data.skills).toEqual(["React", "SQL"]);
  expect(data.careerPreferences.goals).toEqual(["Jobs"]);
});
it("rejects invalid city, year, mobile, portfolio and role with field-specific errors", () => {
  for (const [field, value] of [
    ["city", "Solapur 123"],
    ["graduationYear", "2e3"],
    ["graduationYear", "2027.5"],
    ["mobile", "1234567890"],
    ["portfolio", "https://user:pass@example.com"],
    ["desiredRole", ""],
  ]) {
    const f = form();
    f.set(field, value);
    try {
      validatedProfileForm(f);
      throw Error("Expected validation rejection");
    } catch (e) {
      expect(e.field).toBe(field);
    }
  }
});
it("does not silently truncate too many skills or allow unexpected preferences", () => {
  const f = form();
  f.set("skills", Array.from({ length: 21 }, (_, i) => "Skill" + i).join(","));
  expect(() => validatedProfileForm(f)).toThrow("20 skills");
  f.set("skills", "React");
  f.set("domain", "Invented");
  expect(() => validatedProfileForm(f)).toThrow("career domain");
});
it("requires a goal and deliberate beginner selection if skills are empty", () => {
  const f = form();
  f.delete("goals");
  expect(() => validatedProfileForm(f)).toThrow("career goal");
  f.append("goals", "Jobs");
  f.set("skills", "");
  expect(() => validatedProfileForm(f)).toThrow("just starting");
  f.set("justStarting", "on");
  expect(validatedProfileForm(f).data.careerPreferences.justStarting).toBe(
    true,
  );
});
it("preserves selected interests and privacy without publishing additional profile data", () => {
  const f = form();
  f.set("mobileVisibility", "connections");
  const x = validatedProfileForm(f);
  expect(x.mobilePrivacy.visibility).toBe("connections");
  expect(x.interests.passions).toEqual(["Open Source"]);
  expect(x.data).not.toHaveProperty("resumePath");
  expect(x.data).not.toHaveProperty("resumeUrl");
});
