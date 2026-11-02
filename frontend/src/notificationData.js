import { useEffect, useState } from "react";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
export const notificationLinks = [
  "",
  "/applications",
  "/profile",
  "/mentoring",
  "/planner",
  "/updates",
  "/explore",
];
export function notificationInput(raw) {
  const studentId = String(raw.studentId || "").trim();
  const title = String(raw.title || "").trim();
  const body = String(raw.body || "").trim();
  const link = String(raw.link || "");
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(studentId) ||
    !title ||
    title.length > 120 ||
    !body ||
    body.length > 2000 ||
    !notificationLinks.includes(link)
  )
    throw new Error(
      "Choose a student, enter a title and message, and select a supported destination.",
    );
  return { studentId, title, body, link };
}
export async function sendNotification(uid, raw, requestId) {
  const value = notificationInput(raw);
  const target = requestId
    ? doc(db, "notifications", requestId)
    : doc(collection(db, "notifications"));
  await runTransaction(db, async (tx) => {
    const previous = await tx.get(target);
    if (previous.exists()) return; // Retry the same draft safely after an ambiguous response.

    tx.set(target, {
      ...value,
      createdBy: uid,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export function markNotification(id, read) {
  return updateDoc(doc(db, "notifications", id), {
    read,
    updatedAt: serverTimestamp(),
  });
}
export function newNotificationId() {
  return doc(collection(db, "notifications")).id;
}
export function useUnreadNotification(uid) {
  const [state, setState] = useState({
    uid: null,
    unread: false,
    error: false,
  });
  useEffect(() => {
    if (!db || !uid) return;
    return onSnapshot(
      query(
        collection(db, "notifications"),
        where("studentId", "==", uid),
        where("read", "==", false),
        limit(1),
      ),
      (snapshot) => setState({ uid, unread: !snapshot.empty, error: false }),
      () => setState({ uid, unread: false, error: true }),
    );
  }, [uid]);
  return state.uid === uid ? state : { unread: false, error: false };
}
export function notificationRecord(uid, studentId, title, body, link) {
  return {
    ...notificationInput({ studentId, title, body, link }),
    createdBy: uid,
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
export async function applicationDecision(uid, id, status) {
  if (
    ![
      "submitted",
      "under_review",
      "shortlisted",
      "selected",
      "rejected",
    ].includes(status)
  )
    throw new Error("Choose a valid application status.");
  const target = doc(db, "applications", id),
    notice = doc(collection(db, "notifications"));
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(target);
    if (!snapshot.exists())
      throw new Error("Application not found. Refresh the list.");
    const old = snapshot.data();
    if (old.status === status) return;
    tx.update(target, { status, updatedAt: serverTimestamp() });
    tx.set(
      notice,
      notificationRecord(
        uid,
        old.studentId,
        "Application update",
        `${old.opportunityTitle}: your application is now ${status.replaceAll("_", " ")}.`,
        "/applications",
      ),
    );
  });
}
