import { expect, it } from "vitest";
import { onboardingDraft } from "./onboardingData";
import {
  fullNameFromParts,
  onboardingFieldErrors,
  splitFullName,
} from "./onboardingValidation";
const valid = () => ({
  ...onboardingDraft(null, { displayName: "Vivek Ashok Chavan" }),
  city: "Pune",
  mobile: "9876543210",
  college: "College of Engineering",
  degree: "B.Tech",
  program: "Computer Science",
  graduationYear: "2027",
  bio: "I enjoy building useful applications with a team.",
  skillsText: "C++, React, Python",
  preferences: {
    experience: "Beginner",
    availability: "Not sure yet",
    mode: "Remote",
    desiredRole: "Frontend Developer",
    domain: "Web Development",
    yearOfStudy: "Final year",
    goals: ["Internships"],
    seeking: ["Project Collaborators"],
  },
});
it("accepts international letters and meaningful academic punctuation", () => {
  expect(onboardingFieldErrors(valid(), 4)).toEqual({});
  expect(
    onboardingFieldErrors(
      {
        ...valid(),
        city: "नाशिक",
        nameParts: { first: "José", middle: "André", last: "O’Neill" },
      },
      4,
    ),
  ).toEqual({});
  expect(fullNameFromParts(splitFullName("vivek ashok chavan"))).toBe(
    "VIVEK ASHOK CHAVAN",
  );
});
it.each(["Pune123", "123", "Pune!", "<script>"])(
  "rejects invalid city %s",
  (city) =>
    expect(onboardingFieldErrors({ ...valid(), city }, 1)).toHaveProperty(
      "city",
    ),
);
it.each(["98765", "98765432101", "98765abc10", "1234567890"])(
  "rejects invalid mobile %s",
  (mobile) =>
    expect(onboardingFieldErrors({ ...valid(), mobile }, 1)).toHaveProperty(
      "mobile",
    ),
);
it.each(["first", "middle", "last"])(
  "requires and validates the %s name",
  (key) => {
    for (const value of ["", "123", "John1", "<John>"])
      expect(
        onboardingFieldErrors(
          { ...valid(), nameParts: { ...valid().nameParts, [key]: value } },
          1,
        ),
      ).toHaveProperty(`nameParts.${key}`);
  },
);
it("validates education, graduation year, role, introduction, skills and choices", () => {
  for (const key of [
    "college",
    "degree",
    "program",
    "graduationYear",
    "bio",
    "skillsText",
  ])
    expect(
      onboardingFieldErrors({ ...valid(), [key]: "123" }, 4),
    ).toHaveProperty(key);
  expect(
    onboardingFieldErrors(
      {
        ...valid(),
        preferences: {
          ...valid().preferences,
          desiredRole: "123",
          domain: "",
          goals: [],
          seeking: [],
          yearOfStudy: "",
        },
      },
      4,
    ),
  ).toMatchObject({
    "preferences.desiredRole": expect.any(String),
    "preferences.domain": expect.any(String),
    "preferences.goals": expect.any(String),
    "preferences.seeking": expect.any(String),
    "preferences.yearOfStudy": expect.any(String),
  });
});
it("does not invent a middle name for existing two-part names", () =>
  expect(splitFullName("Existing Student")).toEqual({
    first: "EXISTING",
    middle: "",
    last: "STUDENT",
  }));
