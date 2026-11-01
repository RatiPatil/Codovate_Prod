import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { skillInputError } from "./domain";

export const projectCategories = [
  "Web & apps",
  "AI & data",
  "Design",
  "Hardware",
  "Social impact",
  "Other",
];
export function httpsLink(value, required = false) {
  const text = String(value || "").trim();
  if (!text && !required) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("Use a complete HTTPS link.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    text.length > 500
  )
    throw new Error("Use a complete HTTPS link without embedded credentials.");
  return text;
}
export function communityInput(raw, kind) {
  const title = String(raw.title || "").trim(),
    summary = String(raw.summary || "").trim();
  if (!title || title.length > 120 || !summary || summary.length > 2000)
    throw new Error(
      "Add a title of up to 120 characters and a summary of up to 2,000 characters.",
    );
  if (!projectCategories.includes(raw.category))
    throw new Error("Choose a project category.");
  const skills = String(raw.skills || "");
  const issue = skillInputError(skills);
  if (issue) throw new Error(issue);
  const result = {
    title,
    summary,
    category: raw.category,
    skills: [
      ...new Set(
        skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ],
  };
  if (kind === "projects") {
    if (!["private", "public"].includes(raw.visibility))
      throw new Error("Choose a visibility setting.");
    return {
      ...result,
      visibility: raw.visibility,
      repoUrl: httpsLink(raw.repoUrl),
      demoUrl: httpsLink(raw.demoUrl),
    };
  }
  if (!["open", "closed"].includes(raw.status))
    throw new Error("Choose whether your team is recruiting.");
  const lookingFor = String(raw.lookingFor || "").trim();
  if (!lookingFor || lookingFor.length > 180)
    throw new Error(
      "Describe who you are looking for in up to 180 characters.",
    );
  return { ...result, status: raw.status, lookingFor };
}
export async function saveCommunity(kind, user, profile, raw, existing = null) {
  if (!["projects", "teams"].includes(kind) || !db || !user)
    throw new Error("Sign in first.");
  const value = communityInput(raw, kind);
  if (existing)
    return updateDoc(doc(db, kind, existing.id), {
      ...value,
      updatedAt: serverTimestamp(),
    });
  const name = profile?.name;
  if (!name?.trim()) throw new Error("Add your name in your profile first.");
  const target = doc(collection(db, kind));
  await setDoc(target, {
    ...value,
    studentId: user.uid,
    studentName: name,
    ...(kind === "projects" ? { moderation: "visible" } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return target.id;
}
export const deleteProject = (id) => deleteDoc(doc(db, "projects", id));
export async function moderateCommunity(kind, id, value) {
  if (!["projects", "teams"].includes(kind))
    throw new Error("Invalid collection.");
  if (kind === "projects" && !["visible", "hidden"].includes(value))
    throw new Error("Invalid moderation state.");
  if (kind === "teams" && !["open", "closed", "hidden"].includes(value))
    throw new Error("Invalid team state.");
  await updateDoc(doc(db, kind, id), {
    [kind === "projects" ? "moderation" : "status"]: value,
    updatedAt: serverTimestamp(),
  });
}
export async function requestTeam(user, profile, teamId, note) {
  const text = note.trim();
  if (!text || text.length > 1000)
    throw new Error("Introduce yourself in up to 1,000 characters.");
  if (!profile?.name?.trim())
    throw new Error("Complete your profile name first.");
  const requestRef = doc(db, "teamRequests", user.uid + "_" + teamId);
  await runTransaction(db, async (tx) => {
    const [existing, team] = await Promise.all([
      tx.get(requestRef),
      tx.get(doc(db, "teams", teamId)),
    ]);
    if (existing.exists())
      throw new Error(
        "You already requested this team. Track it under My requests.",
      );
    if (!team.exists() || team.data().status !== "open")
      throw new Error("This team is no longer recruiting.");
    if (team.data().studentId === user.uid)
      throw new Error("This is your own team.");
    tx.set(requestRef, {
      studentId: user.uid,
      studentName: profile.name,
      ownerId: team.data().studentId,
      teamId,
      teamTitle: team.data().title,
      note: text,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function reviewRequest(id, status) {
  if (!["accepted", "declined", "withdrawn"].includes(status))
    throw new Error("Invalid decision.");
  await runTransaction(db, async (tx) => {
    const target = doc(db, "teamRequests", id),
      snapshot = await tx.get(target);
    if (!snapshot.exists()) throw new Error("This request no longer exists.");
    const current = snapshot.data().status;
    if (
      status === "withdrawn"
        ? !["pending", "accepted"].includes(current)
        : current !== "pending"
    )
      throw new Error(
        "This request has already changed. Refresh and check the current status.",
      );
    tx.update(target, { status, updatedAt: serverTimestamp() });
  });
}
