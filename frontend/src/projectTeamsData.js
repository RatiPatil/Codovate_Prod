import {
  collection,
  doc,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { teamInput, teamSnapshot, teamListing } from "./projectTeamDomain";
export {
  teamInput,
  teamSnapshot,
  teamListing,
  teamStatus,
} from "./projectTeamDomain";
function writeRevision(writer, id, team, actorId, create = false) {
  const history = doc(collection(db, "projectTeams", id, "history")),
    next = { ...team, historyId: history.id, updatedAt: serverTimestamp() };
  writer.set(doc(db, "projectTeams", id), next);
  writer.set(history, {
    teamId: id,
    actorId,
    snapshot: teamSnapshot(next),
    createdAt: serverTimestamp(),
  });
  writer.set(
    doc(db, "teamListings", id),
    teamListing(id, next, serverTimestamp()),
  );
  if (create)
    writer.set(doc(db, "conversations", id), {
      kind: "team",
      teamId: id,
      createdAt: serverTimestamp(),
    });
}
export async function createProjectTeam(uid, raw) {
  const value = teamInput(raw),
    ref = doc(collection(db, "projectTeams")),
    batch = writeBatch(db);
  const t = {
    ...value,
    ownerId: uid,
    members: [uid],
    roles: { [uid]: "leader" },
    lifecycle: "active",
    version: 1,
    createdAt: serverTimestamp(),
  };
  writeRevision(batch, ref.id, t, uid, true);
  await batch.commit();
  return ref.id;
}
export async function reviseProjectTeam(id, uid, raw) {
  const value = teamInput(raw);
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "projectTeams", id),
      snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Team unavailable.");
    const old = snap.data();
    if (old.ownerId !== uid)
      throw new Error("Only the leader can change team details.");
    if (value.capacity < old.members.length)
      throw new Error("Capacity cannot be lower than current membership.");
    writeRevision(tx, id, { ...old, ...value, version: old.version + 1 }, uid);
  });
}
export async function changeProjectTeam(id, uid, action, target, role) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(doc(db, "projectTeams", id));
    if (!snap.exists()) throw new Error("Team unavailable.");
    const old = snap.data(),
      next = {
        ...old,
        roles: { ...old.roles },
        members: [...old.members],
        version: old.version + 1,
      };
    if (action === "archive") {
      next.lifecycle = "archived";
      next.recruitment = "closed";
    } else if (action === "reopen") {
      next.lifecycle = "active";
      next.recruitment = "recruiting";
    } else if (action === "role") {
      if (
        !["member", "mentor"].includes(role) ||
        !old.members.includes(target) ||
        target === old.ownerId
      )
        throw new Error("Choose an existing member and a valid role.");
      next.roles[target] = role;
    } else if (action === "leave" || action === "remove") {
      const who = action === "leave" ? uid : target;
      if (who === old.ownerId || !old.members.includes(who))
        throw new Error("The leader must remain a member.");
      next.members = old.members.filter((x) => x !== who);
      delete next.roles[who];
    } else throw new Error("Unknown team action.");
    writeRevision(tx, id, next, uid);
  });
}
export async function requestProjectJoin(uid, listing, note) {
  const text = String(note || "").trim();
  if (!text || text.length > 1000)
    throw new Error("Introduce yourself in up to 1,000 characters.");
  const ref = doc(db, "projectTeamRequests", listing.teamId + "_" + uid);
  await runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    if (old.exists() && ["pending", "accepted"].includes(old.data().status))
      throw new Error(
        "You already have a pending or accepted request for this team.",
      );
    if (old.exists())
      tx.update(ref, {
        note: text,
        status: "pending",
        updatedAt: serverTimestamp(),
      });
    else
      tx.set(ref, {
        teamId: listing.teamId,
        ownerId: listing.ownerId,
        studentId: uid,
        note: text,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
export async function inviteProjectMember(team, studentId) {
  if (!studentId || team.members.includes(studentId))
    throw new Error("Choose a student who has not joined this team.");
  const ref = doc(db, "projectTeamInvites", team.id + "_" + studentId);
  await runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    if (old.exists() && old.data().status === "pending")
      throw new Error("An invitation is already pending.");
    if (old.exists())
      tx.update(ref, { status: "pending", updatedAt: serverTimestamp() });
    else
      tx.set(ref, {
        teamId: team.id,
        ownerId: team.ownerId,
        studentId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
export async function reviewProjectEntry(collectionName, entry, uid, status) {
  if (
    !["projectTeamInvites", "projectTeamRequests"].includes(collectionName) ||
    !["accepted", "declined", "withdrawn", "revoked"].includes(status)
  )
    throw new Error("Invalid membership decision.");
  const ref = doc(db, collectionName, entry.id);
  await runTransaction(db, async (tx) => {
    const request = await tx.get(ref);
    if (!request.exists() || request.data().status !== "pending")
      throw new Error("This request has already changed.");
    if (status === "accepted") {
      const group = await tx.get(doc(db, "projectTeams", entry.teamId));
      if (!group.exists()) throw new Error("Team unavailable.");
      const team = group.data();
      if (
        team.lifecycle !== "active" ||
        team.recruitment === "closed" ||
        team.members.length >= team.capacity
      )
        throw new Error("This team is closed or full.");
      if (team.members.includes(entry.studentId))
        throw new Error("This student is already a member.");
      writeRevision(
        tx,
        entry.teamId,
        {
          ...team,
          members: [...team.members, entry.studentId],
          roles: { ...team.roles, [entry.studentId]: "member" },
          version: team.version + 1,
        },
        uid,
      );
    }
    tx.update(ref, { status, updatedAt: serverTimestamp() });
  });
}
