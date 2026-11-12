import { normalizeStudyField, studyDomains } from "./studyFields";
import { visibleSkills } from "./profileSkills";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { validatedPublicProfile } from "./teamHubData";
export const domains = [
  "Web Development",
  "AI/ML",
  "Data Science",
  "Cyber Security",
  "Startups",
  "Research",
  "Hackathons",
  "Other",
];
export const experienceLevels = ["Beginner", "Intermediate", "Advanced"];
export const seekingOptions = [
  "Hackathon Teammates",
  "Project Collaborators",
  "Startup Co-founders",
  "Research Partners",
];
export const passionOptions = [
  "AI Products",
  "Hackathons",
  "Open Source",
  "Research",
  "Entrepreneurship",
  "Community Projects",
];
export const emptyDetails = {
  desiredRole: "",
  domain: "",
  experience: "",
  college: "",
  degree: "",
  fieldOfStudy: "",
  year: "",
  location: "",
  photoUrl: "",
  achievements: [],
  seeking: [],
  passions: [],
};
export function approvedAvatar(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      ["avatars.githubusercontent.com", "lh3.googleusercontent.com"].includes(
        url.hostname,
      ) &&
      url.href.length <= 500
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function discoveryDraft(profile, user, saved) {
  const p = profile?.careerPreferences || {},
    card = profile?.teammateCard || {};
  return {
    ...emptyDetails,
    desiredRole: p.desiredRole || "",
    domain: p.domain || "",
    experience: p.experience || "",
    college: profile?.college || "",
    degree: profile?.degree || "",
    year: p.yearOfStudy || "",
    location: profile?.city || "",
    seeking: p.seeking || [],
    photoUrl: approvedAvatar(
      Object.hasOwn(card, "photoUrl") ? card.photoUrl : user?.photoURL,
    ),
    achievements: card.achievements || [],
    passions: card.passions || [],
    ...saved,
    fieldOfStudy: normalizeStudyField(
      profile?.program || saved?.fieldOfStudy || "",
    ),
  };
}
export function discoveryDetails(raw) {
  const d = { ...emptyDetails, ...raw };
  for (const [key, max] of Object.entries({
    desiredRole: 100,
    college: 180,
    degree: 100,
    fieldOfStudy: 180,
    year: 40,
    location: 100,
    photoUrl: 500,
  })) {
    d[key] = String(d[key] || "").trim();
    if (d[key].length > max)
      throw new Error("Keep " + key + " within " + max + " characters.");
  }
  d.fieldOfStudy = normalizeStudyField(d.fieldOfStudy);
  if (d.fieldOfStudy.length > 180)
    throw new Error("Keep your field of study within 180 characters.");
  if (
    (d.domain && !domains.includes(d.domain)) ||
    (d.experience && !experienceLevels.includes(d.experience))
  )
    throw new Error("Choose a valid domain and experience level.");
  for (const key of ["achievements", "seeking", "passions"]) {
    const values = Array.isArray(d[key])
      ? d[key]
      : String(d[key] || "").split(",");
    d[key] = [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
    if (
      d[key].length > 6 ||
      d[key].some((v) => v.length > 60 || /[\r\n]/.test(v))
    )
      throw new Error("Add up to six short, single-line tags per field.");
  }
  if (
    d.seeking.some((v) => !seekingOptions.includes(v)) ||
    d.passions.some((v) => !passionOptions.includes(v))
  )
    throw new Error("Choose the listed collaboration goals and interests.");
  if (d.photoUrl) {
    const photo = approvedAvatar(d.photoUrl);
    if (!photo)
      throw new Error(
        "Use a Google or GitHub avatar link, or leave the photo blank.",
      );
    d.photoUrl = photo;
  }
  return Object.fromEntries(
    Object.keys(emptyDetails).map((key) => [key, d[key]]),
  );
}
export async function saveDiscovery(user, profile, raw, shareDetails) {
  const details = discoveryDetails(raw),
    base = validatedPublicProfile(user, profile);
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "discoveryPreferences", user.uid),
      member = doc(db, "memberProfiles", user.uid),
      current = await tx.get(member);
    tx.set(ref, {
      uid: user.uid,
      details,
      shareDetails: !!shareDetails,
      discoverable: current.exists(),
      updatedAt: serverTimestamp(),
    });
    if (current.exists())
      tx.set(member, { ...base, ...(shareDetails ? { details } : {}) });
  });
}
export async function dismissPeer(uid, peerId, dismissed = true) {
  if (!uid || !peerId || peerId.length > 128 || uid === peerId)
    throw new Error("Choose another student.");
  const ref = doc(db, "discoveryDismissals", uid, "members", peerId);
  await runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    if (old.exists())
      tx.update(ref, { dismissed, updatedAt: serverTimestamp() });
    else
      tx.set(ref, {
        studentId: uid,
        peerId,
        dismissed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
const normalized = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();
export function matchReasons(mine, other) {
  const a = mine?.details || {},
    b = other?.details || {},
    skills = new Set((mine?.skills || []).map(canonicalSkill)),
    shared = [
      ...new Set(
        (other.skills || []).map(canonicalSkill).filter((v) => skills.has(v)),
      ),
    ],
    reasons = [];
  if (shared.length)
    reasons.push(
      shared.length + " shared skill" + (shared.length === 1 ? "" : "s"),
    );
  if (a.domain && a.domain === b.domain) reasons.push("Same domain");
  if ((a.passions || []).some((v) => (b.passions || []).includes(v)))
    reasons.push("Similar interests");
  if ((a.seeking || []).some((v) => (b.seeking || []).includes(v)))
    reasons.push("Shared collaboration goals");
  if (a.college && normalized(a.college) === normalized(b.college))
    reasons.push("Same college");
  if (a.year && normalized(a.year) === normalized(b.year))
    reasons.push("Same year");
  if (a.experience && a.experience === b.experience)
    reasons.push("Similar experience level");
  return reasons;
}
const canonicalSkill = (value) => {
  const key = normalized(value).replace(/[.\s_-]/g, "");
  return (
    {
      reactjs: "react",
      js: "javascript",
      machinelearning: "ml",
      artificialintelligence: "ai",
      python3: "python",
      node: "nodejs",
    }[key] || key
  );
};
export function profileMatch(mine, other) {
  const a = mine?.details || {},
    b = other?.details || {};
  const mineSkills = new Set((mine?.skills || []).map(canonicalSkill));
  const otherSkills = new Set((other?.skills || []).map(canonicalSkill));
  const union = new Set([...mineSkills, ...otherSkills]);
  const common = [...mineSkills].filter((value) => otherSkills.has(value));
  let score = union.size ? (30 * common.length) / union.size : 0;
  if (a.domain && a.domain === b.domain) score += 20;
  if ((a.passions || []).some((value) => (b.passions || []).includes(value)))
    score += 15;
  if ((a.seeking || []).some((value) => (b.seeking || []).includes(value)))
    score += 10;
  if (a.college && normalized(a.college) === normalized(b.college)) score += 10;
  if (a.year && normalized(a.year) === normalized(b.year)) score += 5;
  if (a.experience && a.experience === b.experience) score += 10;
  const labels = [];
  if (a.domain === "AI/ML" && b.domain === "AI/ML") labels.push("AI/ML Match");
  if (
    ((a.passions || []).includes("Hackathons") &&
      (b.passions || []).includes("Hackathons")) ||
    (a.domain === "Hackathons" && b.domain === "Hackathons") ||
    ((a.seeking || []).includes("Hackathon Teammates") &&
      (b.seeking || []).includes("Hackathon Teammates"))
  )
    labels.push("Hackathon Enthusiast");
  if (
    (a.domain === "Startups" && b.domain === "Startups") ||
    ((a.seeking || []).includes("Startup Co-founders") &&
      (b.seeking || []).includes("Startup Co-founders"))
  )
    labels.push("Startup Builder");
  return { score: Math.round(score), labels };
}
export function discoverPeers(
  items,
  {
    uid,
    search = "",
    skill = "",
    domain = "",
    city = "",
    fieldOfStudy = "",
    experience = "",
    dismissed = [],
    blocked = [],
    suggested = false,
    mine = {},
  },
) {
  return items
    .filter(
      (p) =>
        p.uid !== uid && !dismissed.includes(p.uid) && !blocked.includes(p.uid),
    )
    .map((p) => ({
      ...p,
      reasons: matchReasons(mine, p),
      match: profileMatch(mine, p),
    }))
    .filter((p) => {
      const d = p.details || {};
      return (
        (!search ||
          normalized(
            [
              p.name,
              d.desiredRole,
              d.college,
              d.degree,
              d.fieldOfStudy,
              d.location,
              ...visibleSkills(p),
            ]
              .filter(Boolean)
              .join(" "),
          ).includes(normalized(search))) &&
        (!skill ||
          skill
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .every((term) =>
              visibleSkills(p).some(
                (value) => canonicalSkill(value) === canonicalSkill(term),
              ),
            )) &&
        (!city || normalized(d.location || "") === normalized(city)) &&
        (!domain || d.domain === domain || (!d.domain && studyDomains(d.fieldOfStudy || d.degree).includes(domain))) &&
        (!fieldOfStudy ||
          normalizeStudyField(d.fieldOfStudy) ===
            normalizeStudyField(fieldOfStudy)) &&
        (!experience || d.experience === experience) &&
        (!suggested || p.match.score > 0)
      );
    })
    .sort((a, b) =>
      suggested
        ? b.match.score - a.match.score ||
          b.reasons.length - a.reasons.length ||
          a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
}

// A stored private choice always wins over the default, including concurrent syncs.
export async function ensureDefaultDiscovery(user, profile) {
  if (!db || !user || !profile) return;
  await runTransaction(db, async (tx) => {
    const prefRef = doc(db, "discoveryPreferences", user.uid);
    const memberRef = doc(db, "memberProfiles", user.uid);
    const pref = await tx.get(prefRef),
      member = await tx.get(memberRef);
    if (pref.data()?.discoverable === false || member.exists()) return;
    const details = discoveryDetails(
      discoveryDraft(profile, user, pref.data()?.details),
    );
    const shareDetails = pref.exists() ? pref.data().shareDetails : true;
    tx.set(prefRef, {
      uid: user.uid,
      details,
      shareDetails,
      discoverable: true,
      updatedAt: serverTimestamp(),
    });
    tx.set(memberRef, {
      ...validatedPublicProfile(user, profile),
      ...(shareDetails ? { details } : {}),
    });
  });
}

export async function savePeer(uid, peerId, saved = true) {
  if (!uid || !peerId || uid === peerId || peerId.length > 128)
    throw new Error("Choose another student.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "teammateShortlists", uid, "members", peerId),
      previous = await tx.get(ref);
    if (previous.exists())
      tx.update(ref, { saved, updatedAt: serverTimestamp() });
    else
      tx.set(ref, {
        studentId: uid,
        peerId,
        saved,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
