import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
export const taskStates = { todo: "To do", doing: "In progress", done: "Done" };
export function taskInput(raw, members) {
  const title = String(raw.title || "").trim(),
    description = String(raw.description || "").trim(),
    assigneeId = String(raw.assigneeId || ""),
    dueDate = String(raw.dueDate || "");
  if (!title || title.length > 160 || /[\r\n]/.test(title))
    throw new Error("Add a short task title of up to 160 characters.");
  if (description.length > 800)
    throw new Error("Keep task details within 800 characters.");
  if (assigneeId && !members.includes(assigneeId))
    throw new Error("Assign the task to a current team member.");
  if (
    dueDate &&
    (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      !Number.isFinite(Date.parse(dueDate + "T12:00:00Z")) ||
      new Date(dueDate + "T12:00:00Z").toISOString().slice(0, 10) !== dueDate)
  )
    throw new Error("Choose a valid due date.");
  return { title, description, assigneeId, dueDate };
}
export async function createTeamTask(teamId, uid, raw, taskId) {
  const ref = taskId
    ? doc(db, "projectTeams", teamId, "tasks", taskId)
    : doc(collection(db, "projectTeams", teamId, "tasks"));
  await runTransaction(db, async (tx) => {
    const team = await tx.get(doc(db, "projectTeams", teamId)),
      existing = await tx.get(ref);
    if (
      !team.exists() ||
      !team.data().members.includes(uid) ||
      team.data().lifecycle !== "active"
    )
      throw new Error("This team is unavailable or read-only.");
    if (existing.exists()) {
      if (existing.data().createdBy !== uid)
        throw new Error("This task already exists.");
      const value = taskInput(raw, team.data().members);
      if (Object.keys(value).some((key) => existing.data()[key] !== value[key]))
        throw new Error(
          "This task was already saved. Close the form and edit it on the board.",
        );
      return;
    }
    tx.set(ref, {
      ...taskInput(raw, team.data().members),
      status: "todo",
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return ref.id;
}
export async function updateTeamTask(teamId, taskId, uid, patch) {
  await runTransaction(db, async (tx) => {
    const team = await tx.get(doc(db, "projectTeams", teamId)),
      task = await tx.get(doc(db, "projectTeams", teamId, "tasks", taskId));
    if (
      !team.exists() ||
      !task.exists() ||
      !team.data().members.includes(uid) ||
      team.data().lifecycle !== "active"
    )
      throw new Error("This task is unavailable or read-only.");
    if (
      !Object.hasOwn(taskStates, patch.status) ||
      Object.keys(patch).some((key) => key !== "status")
    )
      throw new Error("Choose a valid task status.");
    tx.update(doc(db, "projectTeams", teamId, "tasks", taskId), {
      status: patch.status,
      updatedAt: serverTimestamp(),
    });
  });
}
export async function deleteTeamTask(teamId, taskId, uid) {
  await runTransaction(db, async (tx) => {
    const team = await tx.get(doc(db, "projectTeams", teamId)),
      task = await tx.get(doc(db, "projectTeams", teamId, "tasks", taskId));
    if (
      !team.exists() ||
      !task.exists() ||
      team.data().lifecycle !== "active" ||
      !team.data().members.includes(uid) ||
      (team.data().ownerId !== uid && task.data().createdBy !== uid)
    )
      throw new Error("Only the task creator or team leader can delete it.");
    tx.delete(doc(db, "projectTeams", teamId, "tasks", taskId));
  });
}
export async function editTeamTask(teamId, taskId, uid, raw) {
  await runTransaction(db, async (tx) => {
    const team = await tx.get(doc(db, "projectTeams", teamId)),
      task = await tx.get(doc(db, "projectTeams", teamId, "tasks", taskId));
    if (
      !team.exists() ||
      !task.exists() ||
      team.data().lifecycle !== "active" ||
      !team.data().members.includes(uid) ||
      (team.data().ownerId !== uid && task.data().createdBy !== uid)
    )
      throw new Error(
        "Only the task creator or team leader can edit its details.",
      );
    tx.update(doc(db, "projectTeams", teamId, "tasks", taskId), {
      ...taskInput(raw, team.data().members),
      updatedAt: serverTimestamp(),
    });
  });
}
