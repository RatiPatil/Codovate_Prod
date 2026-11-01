import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
const Context = createContext(null);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null),
    [profile, setProfile] = useState(null),
    [admin, setAdmin] = useState(false),
    [loading, setLoading] = useState(configured),
    [sessionError, setSessionError] = useState(null);
  useEffect(() => {
    if (!auth) return;
    let stopProfile = () => {};
    let generation = 0;
    const stop = onAuthStateChanged(
      auth,
      async (next) => {
        const current = ++generation;
        stopProfile();
        setUser(next);
        setProfile(null);
        setAdmin(false);
        setSessionError(null);
        if (!next) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const token = await next.getIdTokenResult();
          if (current !== generation) return;
          setAdmin(token.claims.admin === true);
          stopProfile = onSnapshot(
            doc(db, "users", next.uid),
            (snapshot) => {
              setProfile(snapshot.exists() ? snapshot.data() : null);
              setLoading(false);
            },
            (e) => {
              setSessionError(e);
              setLoading(false);
            },
          );
        } catch (e) {
          if (current === generation) {
            setSessionError(e);
            setLoading(false);
          }
        }
      },
      (e) => {
        setSessionError(e);
        setLoading(false);
      },
    );
    return () => {
      generation++;
      stop();
      stopProfile();
    };
  }, []);
  async function createProfile(current, name) {
    const profileRef = doc(db, "users", current.uid);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(profileRef);
      if (existing.exists()) return;
      transaction.set(profileRef, {
        name: name || current.displayName || "",
        email: current.email || "",
        college: "",
        degree: "",
        graduationYear: "",
        city: "",
        bio: "",
        skills: [],
        portfolio: "",
        resumePath: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  return (
    <Context.Provider
      value={{
        user,
        profile,
        admin,
        loading,
        sessionError,
        createProfile,
        logout: () => signOut(auth),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
