import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
export function FeedStatus({ feed }) {
  if (!feed.error && !feed.loading && !feed.cached) return null;
  return feed.error ? (
    <p role="alert" className="hub-error">
      {feed.error}
    </p>
  ) : (
    <p className="hint" role="status">
      {feed.loading
        ? "Connecting…"
        : feed.cached
          ? "Saved records · reconnecting"
          : "Live updates connected"}
    </p>
  );
}
export function MemberName({ uid, fallback = "Member" }) {
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    setEntry(null);
    if (!db || !uid) return;
    return onSnapshot(
      doc(db, "memberProfiles", uid),
      (s) => setEntry({ uid, name: s.data()?.name || fallback }),
      () => setEntry(null),
    );
  }, [uid, fallback]);
  return <>{entry?.uid === uid ? entry.name : fallback}</>;
}
export function InvitationTitle({ groupId }) {
  const [title, setTitle] = useState("Group invitation");
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      doc(db, "conversations", groupId),
      (s) =>
        setTitle(
          s.exists()
            ? s.data().title +
                (s.data().status === "archived" ? " · Archived" : "")
            : "Group invitation unavailable",
        ),
      () => setTitle("Group invitation unavailable"),
    );
  }, [groupId]);
  return <>{title}</>;
}
