import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { normalizeName, normalizeFullName } from "./profileNames";
import { discoveryDetails } from "./discoveryData";
import { withTimeout } from "./authSupport";
import { skillInputError } from "./domain";

import {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
  needsOnboarding,
  emptyCareerPreferences,
} from "./onboardingContract";
export {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
  needsOnboarding,
};

export function onboardingDraft(profile, user) {
  return {
    name: profile?.name || user?.displayName || "",
    city: profile?.city || "",
    college: profile?.college || "",
    degree: profile?.degree || "",
    program: profile?.program || "",
    graduationYear: profile?.graduationYear || "",
    bio: profile?.bio || "",
    skillsText: (profile?.skills || []).join(", "),
    portfolio: profile?.portfolio || "",
    preferences: { ...emptyCareerPreferences, ...profile?.careerPreferences },
  };
}

export function onboardingInput(raw, step, complete = false, partial = false) {
  if (!Number.isInteger(step) || step < 1 || step > 4)
    throw new Error("Choose a valid onboarding step.");
  const limits = {
    name: 100,
    city: 100,
    college: 180,
    degree: 100,
    program: 180,
    graduationYear: 4,
    bio: 1500,
    portfolio: 500,
  };
  const profile = Object.fromEntries(
    Object.entries(limits).map(([key, limit]) => {
      const value =
        key === "name"
          ? normalizeName(raw[key])
          : String(raw[key] || "").trim();
      if (value.length > limit)
        throw new Error(`Keep ${key} within ${limit} characters.`);
      return [key, value];
    }),
  );
  const skillError = skillInputError(String(raw.skillsText || ""));
  if (skillError) throw new Error(skillError);
  profile.skills = [
    ...new Set(
      String(raw.skillsText || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (
    profile.graduationYear &&
    !/^(20\d{2}|2100)$/.test(profile.graduationYear)
  )
    throw new Error("Enter a graduation year between 2000 and 2100.");
  if (profile.portfolio) {
    let url;
    try {
      url = new URL(profile.portfolio);
    } catch {
      throw new Error("Enter a valid HTTPS portfolio link, or leave it blank.");
    }
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error(
        "Use an HTTPS portfolio link without embedded credentials.",
      );
  }
  const p = { ...emptyCareerPreferences, ...raw.preferences };
  const details = discoveryDetails({
    desiredRole: p.desiredRole,
    domain: p.domain,
    experience: p.experience,
    seeking: p.seeking,
  });
  if (
    !Array.isArray(p.goals) ||
    p.goals.length > 6 ||
    new Set(p.goals).size !== p.goals.length ||
    p.goals.some((goal) => !careerGoals.includes(goal))
  )
    throw new Error("Choose the listed career goals.");
  if (
    !availabilityOptions.includes(p.availability) ||
    !collaborationModes.includes(p.mode) ||
    (p.yearOfStudy && !studyYears.includes(p.yearOfStudy)) ||
    typeof p.justStarting !== "boolean"
  )
    throw new Error("Choose valid education and collaboration preferences.");
  profile.careerPreferences = {
    desiredRole: details.desiredRole,
    domain: details.domain,
    experience: details.experience,
    goals: p.goals,
    seeking: details.seeking,
    availability: p.availability,
    mode: p.mode,
    yearOfStudy: p.yearOfStudy,
    justStarting: p.justStarting,
  };
  if (!partial) {
    normalizeFullName(profile.name);
    if (!profile.city) throw new Error("Enter your city to continue.");
    if (
      (complete || step >= 2) &&
      (!profile.college ||
        !profile.degree ||
        !profile.program ||
        !profile.graduationYear ||
        !p.yearOfStudy)
    )
      throw new Error(
        "Add your college, course, specialization, study stage and graduation year.",
      );
    if (
      (complete || step >= 3) &&
      (!details.desiredRole ||
        !details.domain ||
        !details.experience ||
        !p.goals.length ||
        !profile.bio ||
        (!profile.skills.length && !p.justStarting))
    )
      throw new Error(
        "Choose your role, interest and goals. Write a short introduction and add skills or select Just starting.",
      );
    if ((complete || step === 4) && !details.seeking.length)
      throw new Error("Choose at least one type of teammate you want to find.");
  }
  return profile;
}

export async function saveOnboarding(
  user,
  raw,
  step,
  { complete = false, discoverable = false, partial = false } = {},
) {
  if (!db || !user?.uid) throw new Error("Sign in before saving your profile.");
  const values = onboardingInput(raw, step, complete, partial);
  await withTimeout(
    runTransaction(db, async (tx) => {
      const profileRef = doc(db, "users", user.uid);
      const snapshot = await tx.get(profileRef);
      if (!snapshot.exists())
        throw new Error(
          "Your profile is not ready. Retry the account connection.",
        );
      const existing = snapshot.data();
      // Legacy profiles and completed accounts are never reset or overwritten here.
      if (!needsOnboarding(existing)) return;
      const preferenceRef = doc(db, "discoveryPreferences", user.uid);
      const memberRef = doc(db, "memberProfiles", user.uid);
      const pref = complete ? await tx.get(preferenceRef) : null;
      const member = await tx.get(memberRef);
      const updatedAt = serverTimestamp();
      tx.update(profileRef, {
        ...values,
        onboarding: {
          ...existing.onboarding,
          step: complete ? 4 : partial ? step : Math.min(step + 1, 4),
          status: complete ? "completed" : "in-progress",
          completedAt: complete ? updatedAt : null,
        },
        updatedAt,
      });
      tx.set(doc(db, "adminUsers", user.uid), {
        uid: user.uid,
        fullName: values.name,
        joinedAt: existing.createdAt,
        updatedAt,
      });
      if (complete) {
        const details = discoveryDetails({
          ...pref?.data()?.details,
          desiredRole: values.careerPreferences.desiredRole,
          domain: values.careerPreferences.domain,
          experience: values.careerPreferences.experience,
          college: values.college,
          year: values.careerPreferences.yearOfStudy,
          location: values.city,
          seeking: values.careerPreferences.seeking,
        });
        tx.set(preferenceRef, {
          uid: user.uid,
          details,
          shareDetails: false,
          updatedAt,
        });
        if (discoverable)
          tx.set(memberRef, {
            uid: user.uid,
            name: values.name,
            skills: values.skills,
            updatedAt,
          });
        else if (member.exists()) tx.delete(memberRef);
      } else if (member.exists()) {
        tx.update(memberRef, {
          name: values.name,
          skills: values.skills,
          updatedAt,
        });
      }
    }),
    "app/profile-timeout",
    25000,
  );
}
