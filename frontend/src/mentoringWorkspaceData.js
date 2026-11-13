import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { httpsLink } from "./communityData";

export const emptyPreparation = { goal: "", context: "", artifactUrl: "" };
export const emptyPlan = { summary: "", actions: [] };
const bounded = (raw, max, label) => {
  const value = String(raw || "").trim();
  if (value.length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
};
export function preparationInput(raw) {
  const goal = bounded(raw.goal, 300, "Your goal");
  if (!goal) throw new Error("Add one clear goal for this conversation.");
  return {
    goal,
    context: bounded(raw.context, 1500, "Your context"),
    artifactUrl: httpsLink(raw.artifactUrl),
  };
}
export function actionPlanInput(raw) {
  const summary = bounded(raw.summary, 1500, "Session takeaway");
  const actions = [raw.action1, raw.action2, raw.action3]
    .map((v) => bounded(v, 180, "Next step"))
    .filter(Boolean);
  if (!summary || !actions.length)
    throw new Error("Add a takeaway and at least one next step.");
  if (new Set(actions).size !== actions.length)
    throw new Error("Each next step should be different.");
  return { summary, actions };
}
export function reflectionInput(raw) {
  const rating = Number(raw.rating);
  const reflection = bounded(raw.reflection, 1000, "Reflection");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !reflection)
    throw new Error("Choose a rating and share what you will apply next.");
  return { rating, reflection };
}
// A workspace has the same ID as its booking. No public collection contains its content.
export async function saveMentoringWorkspace(bookingId, kind, raw) {
  const value =
    kind === "preparation"
      ? preparationInput(raw)
      : kind === "plan"
        ? actionPlanInput(raw)
        : kind === "feedback"
          ? reflectionInput(raw)
          : null;
  if (!value && kind !== "progress")
    throw new Error("Unknown workspace action.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "mentorWorkspaces", bookingId);
    const [bookingSnap, workspaceSnap] = await Promise.all([
      tx.get(doc(db, "mentorBookings", bookingId)),
      tx.get(ref),
    ]);
    if (!bookingSnap.exists()) throw new Error("This booking is unavailable.");
    const booking = bookingSnap.data();
    if (["cancelled", "declined"].includes(booking.status))
      throw new Error("This booking is closed. Its workspace is read-only.");
    if (kind === "plan" && !["confirmed", "completed"].includes(booking.status))
      throw new Error("Confirm the booking before sharing its action plan.");
    if (kind === "feedback" && booking.status !== "completed")
      throw new Error("You can reflect after the session is marked completed.");
    const old = workspaceSnap.exists()
      ? workspaceSnap.data()
      : {
          bookingId,
          studentId: booking.studentId,
          preparation: emptyPreparation,
          plan: emptyPlan,
          completedActions: [],
          rating: 0,
          reflection: "",
          createdAt: serverTimestamp(),
        };
    const changes = { updatedAt: serverTimestamp() };
    if (value) {
      if (kind === "feedback") Object.assign(changes, value);
      else changes[kind] = value;
      if (kind === "plan") changes.completedActions = [];
    } else {
      const index = Number(raw.index);
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= old.plan.actions.length
      )
        throw new Error("This next step is no longer available.");
      // A stale checkbox cannot accidentally complete a replacement action.
      if (old.plan.actions[index] !== raw.action)
        throw new Error("The plan has changed. Review the latest next steps.");
      const selected = new Set(old.completedActions);
      raw.checked ? selected.add(index) : selected.delete(index);
      changes.completedActions = [...selected].sort();
    }
    if (workspaceSnap.exists()) tx.update(ref, changes);
    else tx.set(ref, { ...old, ...changes });
  });
}
