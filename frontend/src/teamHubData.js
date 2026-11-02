import { useEffect, useState } from "react";
import {
  collection,
  doc,
  query,
  where,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { withTimeout } from "./authSupport";
export function useTeamFeed(path, uid, filters = [], size = 100) {
  const key = JSON.stringify([path, uid, filters, size]);
  const [state, setState] = useState({
    key: "",
    items: [],
    loading: true,
    error: "",
    cached: false,
  });
  useEffect(() => {
    setState({ key, items: [], loading: !!db, error: "", cached: false });
    if (!db || !uid || !path) return;
    let active = true;
    const constraints = filters.map(([field, op, value]) =>
      where(field, op, value),
    );
    const stop = onSnapshot(
      query(collection(db, path), ...constraints, limit(size)),
      { includeMetadataChanges: true },
      (s) => {
        if (active)
          setState({
            key,
            items: s.docs.map((d) => ({ id: d.id, ...d.data() })),
            loading: false,
            error: "",
            cached: s.metadata.fromCache,
          });
      },
      () => {
        if (active)
          setState({
            key,
            items: [],
            loading: false,
            error:
              "Could not load live records. Check your connection and deployed rules.",
            cached: false,
          });
      },
    );
    return () => {
      active = false;
      stop();
    };
  }, [key]);
  return state.key === key
    ? state
    : { items: [], loading: true, error: "", cached: false };
}
export function validatedPublicProfile(user, profile) {
  if (!user || !profile?.name?.trim())
    throw new Error("Complete your profile name first.");
  const skills = profile.skills || [];
  if (
    !Array.isArray(skills) ||
    skills.length > 20 ||
    skills.some(
      (s) =>
        typeof s !== "string" || !s.trim() || s.length > 60 || /[\r\n]/.test(s),
    )
  )
    throw new Error("Review your profile skills first.");
  return {
    uid: user.uid,
    name: profile.name,
    skills,
    updatedAt: serverTimestamp(),
  };
}
export async function publishMember(user, profile) {
  if (!db) throw new Error("Connect Firebase first.");
  await setDoc(
    doc(db, "memberProfiles", user.uid),
    validatedPublicProfile(user, profile),
  );
}
export const hideMember = (uid) => deleteDoc(doc(db, "memberProfiles", uid));
export async function connectMember(uid, target) {
  if (!uid || !target || uid === target)
    throw new Error("Choose another member.");
  const id = uid + "_" + target,
    reverse = target + "_" + uid;
  await runTransaction(db, async (tx) => {
    const a = await tx.get(doc(db, "connections", id));
    const b = await tx.get(doc(db, "connections", reverse));
    if (a.exists() || b.exists())
      throw new Error("A connection already exists. Check Connections.");
    tx.set(doc(db, "connections", id), {
      fromId: uid,
      toId: target,
      status: "pending",
      blockedBy: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function connectionDecision(id, status) {
  if (
    !["pending", "accepted", "declined", "withdrawn", "blocked"].includes(
      status,
    )
  )
    throw new Error("Invalid connection decision.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "connections", id),
      snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Connection unavailable.");
    tx.update(ref, {
      status,
      blockedBy: status === "blocked" ? auth.currentUser.uid : "",
      updatedAt: serverTimestamp(),
    });
  });
}
export async function openDirect(connection) {
  const id = "dm_" + connection.id,
    ref = doc(db, "conversations", id);
  await runTransaction(db, async (tx) => {
    const current = await tx.get(ref);
    if (current.exists()) return;
    tx.set(ref, {
      kind: "direct",
      connectionId: connection.id,
      members: [connection.fromId, connection.toId],
      createdAt: serverTimestamp(),
    });
  });
  return id;
}
export async function createGroup(uid, title) {
  const name = String(title || "").trim();
  if (!name || name.length > 100)
    throw new Error("Enter a group name of up to 100 characters.");
  const ref = doc(collection(db, "conversations"));
  await setDoc(ref, {
    kind: "group",
    title: name,
    ownerId: uid,
    members: [uid],
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function inviteToGroup(group, studentId) {
  if (group.members.includes(studentId))
    throw new Error("This member is already in the group.");
  const ref = doc(db, "groupInvites", group.id + "_" + studentId);
  await runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    if (old.exists()) {
      if (old.data().status === "pending")
        throw new Error("An invitation is already pending.");
      tx.update(ref, { status: "pending", updatedAt: serverTimestamp() });
    } else
      tx.set(ref, {
        groupId: group.id,
        ownerId: group.ownerId,
        studentId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
export async function answerInvite(invite, status) {
  if (!["accepted", "declined"].includes(status))
    throw new Error("Invalid invitation response.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "groupInvites", invite.id),
      request = await tx.get(ref),
      groupRef = doc(db, "conversations", invite.groupId),
      group = await tx.get(groupRef);
    if (
      !request.exists() ||
      request.data().status !== "pending" ||
      !group.exists() ||
      group.data().status !== "active"
    )
      throw new Error("This invitation is no longer available.");
    if (status === "accepted") {
      if (group.data().members.length >= 12)
        throw new Error("This group has reached its 12-member limit.");
      tx.update(groupRef, {
        members: [...group.data().members, invite.studentId],
        updatedAt: serverTimestamp(),
      });
    }
    tx.update(ref, { status, updatedAt: serverTimestamp() });
  });
}
export async function updateGroup(group, action, uid) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "conversations", group.id),
      snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Group unavailable.");
    if (action === "archive")
      tx.update(ref, { status: "archived", updatedAt: serverTimestamp() });
    else
      tx.update(ref, {
        members: snap.data().members.filter((id) => id !== uid),
        updatedAt: serverTimestamp(),
      });
  });
}
export async function sendTeamMessage(
  conversationId,
  messageId,
  uid,
  name,
  text,
) {
  if (!String(name || "").trim())
    throw new Error("Complete your profile name first.");
  const value = String(text || "").trim();
  if (!value || value.length > 1500)
    throw new Error("Write a message of up to 1,500 characters.");
  const ref = doc(db, "conversations", conversationId, "messages", messageId);
  await withTimeout(
    runTransaction(db, async (tx) => {
      const old = await tx.get(ref);
      if (old.exists()) return;
      tx.set(ref, {
        senderId: uid,
        senderName: name,
        text: value,
        createdAt: serverTimestamp(),
      });
    }),
    "chat/send-timeout",
    15000,
  );
}

export async function revokeGroupInvite(id) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "groupInvites", id),
      snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== "pending")
      throw new Error("Invitation is no longer pending.");
    tx.update(ref, { status: "revoked", updatedAt: serverTimestamp() });
  });
}
