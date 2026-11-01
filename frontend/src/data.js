import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  orderBy,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, configured } from "./firebase";
import { samples } from "./sample";
import { isOpen } from "./domain";
export function useOpportunities() {
  const [state, setState] = useState({
    items: configured ? [] : samples,
    loading: configured,
    error: null,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!db) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    return onSnapshot(
      query(
        collection(db, "opportunities"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
      (s) =>
        setState({
          items: s.docs.map((d) => ({ ...d.data(), id: d.id })),
          loading: false,
          error: null,
        }),
      (error) => setState({ items: [], loading: false, error }),
    );
  }, [retry]);
  return { ...state, retry: () => setRetry((v) => v + 1) };
}
export function useOwned(collectionName, uid) {
  const [state, setState] = useState({
    items: [],
    loading: !!uid,
    error: null,
  });
  useEffect(() => {
    setState({ items: [], loading: !!uid, error: null });
    if (!db || !uid) return;
    return onSnapshot(
      query(collection(db, collectionName), where("studentId", "==", uid)),
      (s) =>
        setState({
          items: s.docs.map((d) => ({ ...d.data(), id: d.id })),
          loading: false,
          error: null,
        }),
      (error) => setState({ items: [], loading: false, error }),
    );
  }, [collectionName, uid]);
  return state;
}
export async function applyToOpportunity(
  user,
  profile,
  opportunity,
  coverNote,
) {
  if (!db || !user) throw new Error("Sign in first.");
  if (!profile?.name || !profile?.college || !profile?.resumePath)
    throw new Error(
      "Complete your name, college and résumé in your profile first.",
    );
  const ref = doc(db, "applications", user.uid + "_" + opportunity.id);
  await runTransaction(db, async (transaction) => {
    const [existing, listing] = await Promise.all([
      transaction.get(ref),
      transaction.get(doc(db, "opportunities", opportunity.id)),
    ]);
    if (existing.exists())
      throw new Error("You have already applied to this opportunity.");
    if (!listing.exists() || !isOpen(listing.data()))
      throw new Error("This opportunity is no longer accepting applications.");
    transaction.set(ref, {
      studentId: user.uid,
      opportunityId: opportunity.id,
      opportunityTitle: listing.data().title,
      organization: listing.data().organization,
      studentName: profile.name,
      college: profile.college,
      resumePath: profile.resumePath,
      coverNote,
      status: "submitted",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export async function toggleSaved(uid, item, saved) {
  const ref = doc(db, "bookmarks", uid + "_" + item.id);
  if (saved) await deleteDoc(ref);
  else
    await setDoc(ref, {
      studentId: uid,
      opportunityId: item.id,
      title: item.title,
      organization: item.organization,
      type: item.type,
      createdAt: serverTimestamp(),
    });
}
