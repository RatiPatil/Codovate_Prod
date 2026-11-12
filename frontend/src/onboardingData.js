import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { discoveryDetails } from "./discoveryData";
import { withTimeout } from "./authSupport";
import { skillInputError } from "./domain";
import {
  splitFullName,
  normalizedNameParts,
  fullNameFromParts,
  localMobile,
  onboardingFieldErrors,
} from "./onboardingValidation";

import {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
  needsOnboarding,
  emptyCareerPreferences,
  initialOnboarding,
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
    nameParts:
      profile?.nameParts || splitFullName(profile?.name || user?.displayName),
    mobile: localMobile(profile?.mobile || user?.phoneNumber),
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
  const fieldErrors = onboardingFieldErrors(raw, complete ? 4 : step, partial);
  if (Object.keys(fieldErrors).length)
    throw Object.assign(new Error(Object.values(fieldErrors)[0]), {
      fields: fieldErrors,
    });
  const nameParts = normalizedNameParts(raw);
  const limits = {
    name: 100,
    city: 100,
    ...(step >= 2
      ? { college: 180, degree: 100, program: 180, graduationYear: 4 }
      : {}),
    ...(step >= 3 ? { bio: 1500 } : {}),
  };
  const profile = Object.fromEntries(
    Object.entries(limits).map(([key, limit]) => {
      const value =
        key === "name"
          ? fullNameFromParts(nameParts)
          : String(raw[key] || "").trim();
      if (value.length > limit)
        throw new Error(`Keep ${key} within ${limit} characters.`);
      return [key, value];
    }),
  );
  profile.nameParts = nameParts;
  profile.mobile = raw.mobile ? `+91${raw.mobile}` : "";
  // Do not overwrite or validate fields the user has not reached yet.
  if (step === 1) return profile;
  const skillError =
    step >= 3 ? skillInputError(String(raw.skillsText || "")) : "";
  if (skillError) throw new Error(skillError);
  if (step >= 3)
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

export function missingProfileDefaults(existing, user, createdAt) {
  const defaults = {
    name: "",
    email: user.email || "",
    college: "",
    degree: "",
    graduationYear: "",
    city: "",
    bio: "",
    skills: [],
    portfolio: "",
    resumePath: "",
    createdAt,
  };
  return Object.fromEntries(
    Object.entries(defaults).filter(([key]) => !Object.hasOwn(existing, key)),
  );
}

export async function saveOnboarding(
  user,
  raw,
  step,
  { complete = false, discoverable = false, partial = false } = {},
) {
  if (!db || !user?.uid) throw new Error("Sign in before saving your profile.");
  const values = onboardingInput(raw, step, complete, partial);
  let stage = "READ_PROFILE";
  try {
    await withTimeout(
      runTransaction(db, async (tx) => {
        const profileRef = doc(db, "users", user.uid);
        stage = "READ_PROFILE";
        const snapshot = await tx.get(profileRef);
        if (!snapshot.exists())
          throw new Error(
            "Your profile is not ready. Retry the account connection.",
          );
        const existing = snapshot.data();
        // Completed accounts stay complete. Existing profiles enroll on their first save.
        if (!needsOnboarding(existing)) return;
        const preferenceRef = doc(db, "discoveryPreferences", user.uid);
        const memberRef = doc(db, "memberProfiles", user.uid);
        stage = "READ_PREFERENCES";
        const pref = complete ? await tx.get(preferenceRef) : null;
        const directoryRef = doc(db, "adminUsers", user.uid);
        stage = "READ_DIRECTORY";
        const directory = await tx.get(directoryRef);
        const syncMember =
          complete || values.name !== existing.name || step >= 3;
        stage = "READ_MEMBER";
        const member = syncMember ? await tx.get(memberRef) : null;
        const updatedAt = serverTimestamp();
        const createdAt = Object.hasOwn(existing, "createdAt")
          ? existing.createdAt
          : updatedAt;
        stage = "WRITE_PROFILE";
        tx.update(profileRef, {
          ...missingProfileDefaults(existing, user, createdAt),
          ...values,
          onboarding: {
            ...(existing.onboarding || initialOnboarding(createdAt)),
            step: complete ? 4 : partial ? step : Math.min(step + 1, 4),
            status: complete ? "completed" : "in-progress",
            completedAt: complete ? updatedAt : null,
          },
          updatedAt,
        });
        if (!directory.exists() || directory.data().fullName !== values.name) {
          tx.set(directoryRef, {
            uid: user.uid,
            fullName: values.name,
            joinedAt: createdAt,
            updatedAt,
          });
        }
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
          else if (member?.exists()) tx.delete(memberRef);
        } else if (member?.exists()) {
          tx.update(memberRef, {
            name: values.name,
            skills: values.skills || existing.skills || [],
            updatedAt,
          });
        }
      }),
      "app/profile-timeout",
      25000,
    );
  } catch (failure) {
    throw Object.assign(
      new Error(failure.message || "The profile could not be saved."),
      { code: failure.code, onboardingStage: stage, cause: failure },
    );
  }
}
