import {
  domains,
  experienceLevels,
  seekingOptions,
  passionOptions,
  approvedAvatar,
} from "./discoveryData";
import {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
} from "./onboardingContract";
import { normalizeName } from "./profileNames";

const letters = /\p{L}/u;
const nameCharacters = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u;
const cityCharacters = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u;
const academicCharacters = /^[\p{L}\p{M}\p{N} &'’().,+/#:-]+$/u;

export function splitFullName(value) {
  const parts = normalizeName(value).split(" ").filter(Boolean);
  return {
    first: parts[0] || "",
    middle: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    last: parts.length > 1 ? parts.at(-1) : "",
  };
}
export function normalizedNameParts(raw) {
  const p = raw.nameParts || splitFullName(raw.name);
  return {
    first: normalizeName(p.first),
    middle: normalizeName(p.middle),
    last: normalizeName(p.last),
  };
}
export function fullNameFromParts(parts) {
  return normalizeName(
    [parts.first, parts.middle, parts.last].filter(Boolean).join(" "),
  );
}
export function localMobile(value) {
  return String(value || "").replace(/^\+91/, "");
}
export function onboardingFieldErrors(raw, step, partial = false) {
  const errors = {};
  const parts = normalizedNameParts(raw);
  for (const [key, label] of [
    ["first", "First name"],
    ["middle", "Middle name"],
    ["last", "Last name"],
  ]) {
    if (
      (!partial || parts[key]) &&
      (!nameCharacters.test(parts[key]) ||
        !letters.test(parts[key]) ||
        parts[key].length > 40)
    )
      errors[`nameParts.${key}`] =
        `${label} must contain letters only, with spaces, apostrophes, periods or hyphens (up to 40 characters).`;
  }
  if (fullNameFromParts(parts).length > 100)
    errors["nameParts.first"] = "Keep your full name within 100 characters.";
  const city = String(raw.city || "").trim();
  if (
    (!partial || city) &&
    (city.length < 2 || city.length > 100 || !cityCharacters.test(city))
  )
    errors.city =
      "Enter a city using letters, spaces, apostrophes, periods or hyphens. Numbers are not allowed.";
  const mobile = String(raw.mobile || "");
  if ((!partial || mobile) && !/^[6-9]\d{9}$/.test(mobile))
    errors.mobile =
      "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.";
  if (step >= 2) {
    for (const [key, label, max] of [
      ["college", "College name", 180],
      ["degree", "Course / degree", 100],
      ["program", "Specialization", 180],
    ]) {
      const value = String(raw[key] || "").trim();
      if (
        (!partial || value) &&
        (value.length < 2 ||
          value.length > max ||
          !letters.test(value) ||
          !academicCharacters.test(value))
      )
        errors[key] =
          `Enter a valid ${label.toLowerCase()} (2–${max} characters). Use letters and standard academic punctuation.`;
    }
    if (
      (!partial || raw.graduationYear) &&
      !/^(20\d{2}|2100)$/.test(String(raw.graduationYear || "").trim())
    )
      errors.graduationYear =
        "Enter a four-digit graduation year between 2000 and 2100.";
    if (!partial && !raw.preferences?.yearOfStudy)
      errors["preferences.yearOfStudy"] = "Choose your study stage.";
  }
  if (step >= 3) {
    if (raw.photoUrl && !approvedAvatar(raw.photoUrl))
      errors.photoUrl =
        "Use a valid Google or GitHub avatar link, or leave it blank to use initials.";
    const achievements = String(raw.achievementsText || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (
      achievements.length > 6 ||
      achievements.some((value) => value.length > 60 || /[\r\n]/.test(value))
    )
      errors.achievementsText =
        "Add up to six achievements of 1–60 characters, separated by commas.";
    if (
      raw.passions &&
      (!Array.isArray(raw.passions) ||
        raw.passions.length > 6 ||
        new Set(raw.passions).size !== raw.passions.length ||
        raw.passions.some((value) => !passionOptions.includes(value)))
    )
      errors.passions = "Choose passions from the listed options.";
    const role = String(raw.preferences?.desiredRole || "").trim();
    if (
      (!partial || role) &&
      (role.length < 2 ||
        role.length > 100 ||
        !letters.test(role) ||
        !academicCharacters.test(role))
    )
      errors["preferences.desiredRole"] =
        "Enter a professional role using 2–100 characters, including letters.";
    const bio = String(raw.bio || "").trim();
    if (
      (!partial || bio) &&
      (bio.length < 20 || bio.length > 1500 || !letters.test(bio))
    )
      errors.bio =
        "Write an introduction of 20–1,500 characters, including words about yourself.";
    const skills = String(raw.skillsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      skills.length > 20 ||
      skills.some(
        (skill) =>
          skill.length > 60 || !letters.test(skill) || /[\r\n]/.test(skill),
      )
    )
      errors.skillsText =
        "Add up to 20 skills of 1–60 characters, including letters. Separate them with commas, for example React, C++, Python.";
    if (!partial && !skills.length && !raw.preferences?.justStarting)
      errors.skillsText = "Add your skills or select ‘I’m just starting’.";
    if (!partial && !raw.preferences?.domain)
      errors["preferences.domain"] = "Choose your area of interest.";
    if (!partial && !raw.preferences?.goals?.length)
      errors["preferences.goals"] = "Choose at least one career goal.";
  }
  if (step >= 4 && !partial && !raw.preferences?.seeking?.length)
    errors["preferences.seeking"] =
      "Choose at least one type of teammate you want to find.";
  const p = raw.preferences || {};
  for (const [key, options, atStep, label] of [
    ["yearOfStudy", studyYears, 2, "study stage"],
    ["domain", domains, 3, "area of interest"],
    ["experience", experienceLevels, 3, "experience level"],
    ["availability", availabilityOptions, 4, "weekly availability"],
    ["mode", collaborationModes, 4, "collaboration mode"],
  ]) {
    if (step >= atStep && (!partial || p[key]) && !options.includes(p[key]))
      errors[`preferences.${key}`] = `Choose a valid ${label}.`;
  }
  for (const [key, options, atStep, max] of [
    ["goals", careerGoals, 3, 6],
    ["seeking", seekingOptions, 4, 4],
  ]) {
    if (
      step >= atStep &&
      p[key] !== undefined &&
      (!Array.isArray(p[key]) ||
        p[key].length > max ||
        new Set(p[key]).size !== p[key].length ||
        p[key].some((value) => !options.includes(value)))
    )
      errors[`preferences.${key}`] =
        `Choose up to ${max} distinct options from the list.`;
  }
  return errors;
}
