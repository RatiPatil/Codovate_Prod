import { normalizeFullName } from "./profileNames";
import { httpsLink } from "./communityData";
import { mobileFormValues } from "./MobilePrivacy";
import { profileInterests } from "./ProfileInterests";
import { domains, experienceLevels, seekingOptions } from "./discoveryData";
import {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
} from "./onboardingContract";
const fail = (field, message) => {
  throw Object.assign(new Error(message), { field });
};
const clean = (value) =>
  String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ");
export function validatedProfileForm(form) {
  const data = {};
  try {
    data.name = normalizeFullName(form.get("name"));
  } catch (e) {
    fail("name", e.message);
  }
  for (const [field, label, max] of [
    ["college", "College / institution", 180],
    ["degree", "Degree / programme", 100],
  ]) {
    data[field] = clean(form.get(field));
    if (
      !data[field] ||
      data[field].length > max ||
      !/[\p{L}]/u.test(data[field])
    )
      fail(
        field,
        `${label} must include letters and be within ${max} characters.`,
      );
  }
  data.city = clean(form.get("city"));
  if (!/^[\p{L}\p{M}][\p{L}\p{M}'’ .-]{1,99}$/u.test(data.city))
    fail(
      "city",
      "Enter a city using letters, spaces, hyphens or apostrophes. Numbers are not allowed.",
    );
  data.graduationYear = String(form.get("graduationYear") || "").trim();
  if (!/^(20\d{2}|2100)$/.test(data.graduationYear))
    fail(
      "graduationYear",
      "Enter a four-digit graduation year from 2000 to 2100.",
    );
  data.bio = String(form.get("bio") || "").trim();
  if (data.bio.length > 1500)
    fail("bio", "Keep your introduction within 1,500 characters.");
  try {
    data.portfolio = httpsLink(form.get("portfolio"));
  } catch (e) {
    fail("portfolio", e.message);
  }
  const rawSkills = String(form.get("skills") || "");
  if (/[\r\n]/.test(rawSkills))
    fail(
      "skills",
      "Separate skills with commas and keep each skill on one line.",
    );
  const seen = new Set();
  data.skills = rawSkills
    .split(",")
    .map(clean)
    .filter(Boolean)
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (data.skills.length > 20 || data.skills.some((s) => s.length > 60))
    fail("skills", "Add up to 20 skills, each within 60 characters.");
  let mobilePrivacy;
  try {
    mobilePrivacy = mobileFormValues(
      form.get("mobile"),
      form.get("mobileVisibility"),
    );
  } catch (e) {
    fail(
      form.get("mobileVisibility") === null ? "mobileVisibility" : "mobile",
      e.message,
    );
  }
  data.mobile = mobilePrivacy.mobile;
  const p = {
    desiredRole: clean(form.get("desiredRole")),
    domain: form.get("domain"),
    experience: form.get("experience"),
    yearOfStudy: form.get("yearOfStudy"),
    availability: form.get("availability"),
    mode: form.get("mode"),
    goals: [...new Set(form.getAll("goals"))],
    seeking: [...new Set(form.getAll("seeking"))],
    justStarting: form.get("justStarting") === "on",
  };
  if (!p.desiredRole || p.desiredRole.length > 100)
    fail("desiredRole", "Add your desired role in up to 100 characters.");
  for (const [k, options, label] of [
    ["domain", domains, "career domain"],
    ["experience", experienceLevels, "experience level"],
    ["yearOfStudy", studyYears, "year of study"],
    ["availability", availabilityOptions, "availability"],
    ["mode", collaborationModes, "collaboration mode"],
  ])
    if (!options.includes(p[k])) fail(k, `Choose a valid ${label}.`);
  if (
    !p.goals.length ||
    p.goals.length > 6 ||
    p.goals.some((x) => !careerGoals.includes(x))
  )
    fail("goals", "Choose at least one career goal.");
  if (
    p.seeking.length > 4 ||
    p.seeking.some((x) => !seekingOptions.includes(x))
  )
    fail("seeking", "Choose one of the listed collaboration interests.");
  if (!data.skills.length && !p.justStarting)
    fail(
      "skills",
      "Add your skills or select “I am just starting” in Career direction.",
    );
  data.careerPreferences = p;
  let interests;
  try {
    interests = profileInterests(form);
  } catch (e) {
    fail("achievements", e.message);
  }
  return { data, mobilePrivacy, interests };
}
