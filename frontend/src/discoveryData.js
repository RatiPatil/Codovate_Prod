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
  year: "",
  location: "",
  photoUrl: "",
  achievements: [],
  seeking: [],
  passions: [],
};
export function discoveryDetails(raw) {
  const d = { ...emptyDetails, ...raw };
  for (const [key, max] of Object.entries({
    desiredRole: 100,
    college: 180,
    year: 40,
    location: 100,
    photoUrl: 500,
  })) {
    d[key] = String(d[key] || "").trim();
    if (d[key].length > max)
      throw new Error("Keep " + key + " within " + max + " characters.");
  }
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
    const u = new URL(d.photoUrl);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      !["avatars.githubusercontent.com", "lh3.googleusercontent.com"].includes(
        u.hostname,
      )
    )
      throw new Error(
        "Use a Google or GitHub avatar link, or leave the photo blank.",
      );
    d.photoUrl = u.href;
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
    skills = new Set((mine?.skills || []).map(normalized)),
    shared = [
      ...new Set(
        (other.skills || []).map(normalized).filter((v) => skills.has(v)),
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
export function discoverPeers(
  items,
  {
    uid,
    search = "",
    skill = "",
    domain = "",
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
    .map((p) => ({ ...p, reasons: matchReasons(mine, p) }))
    .filter((p) => {
      const d = p.details || {};
      return (
        (!search ||
          normalized(
            p.name + " " + (d.desiredRole || "") + " " + p.skills.join(" "),
          ).includes(normalized(search))) &&
        (!skill ||
          p.skills.some((v) => normalized(v).includes(normalized(skill)))) &&
        (!domain || d.domain === domain) &&
        (!experience || d.experience === experience) &&
        (!suggested || p.reasons.length > 0)
      );
    })
    .sort((a, b) =>
      suggested
        ? b.reasons.length - a.reasons.length || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
}
