import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
import { SESSION_TIMEOUT_MS, withTimeout, sessionFailure } from "./authSupport";
import { initialOnboarding } from "./onboardingContract";
import { normalizeName } from "./profileNames";
const Context = createContext(null);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null),
    [profile, setProfile] = useState(null),
    [admin, setAdmin] = useState(false),
    [loading, setLoading] = useState(configured),
    [sessionError, setSessionError] = useState(null),
    [retryVersion, setRetryVersion] = useState(0);
  const userRef = useRef(null);
  useEffect(() => {
    if (!auth) return;
    let active = true,
      generation = 0,
      stopProfile = () => {},
      profileTimer;
    const authTimer = setTimeout(() => {
      if (active) {
        setSessionError(sessionFailure({ code: "app/auth-timeout" }, "auth"));
        setLoading(false);
      }
    }, SESSION_TIMEOUT_MS);
    const stop = onAuthStateChanged(
      auth,
      async (next) => {
        clearTimeout(authTimer);
        clearTimeout(profileTimer);
        const current = ++generation;
        stopProfile();
        userRef.current = next;
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
          const token = await withTimeout(
            next.getIdTokenResult(),
            "app/auth-timeout",
          );
          if (!active || current !== generation) return;
          setAdmin(token.claims.admin === true);
          profileTimer = setTimeout(() => {
            if (active && current === generation) {
              stopProfile();
              setSessionError(
                sessionFailure({ code: "app/profile-timeout" }, "profile"),
              );
              setLoading(false);
            }
          }, SESSION_TIMEOUT_MS);
          stopProfile = onSnapshot(
            doc(db, "users", next.uid),
            { includeMetadataChanges: true },
            (snapshot) => {
              if (!active || current !== generation) return;
              // A missing cache entry is not proof that the server profile is absent.
              if (snapshot.metadata?.fromCache && !snapshot.exists()) return;
              clearTimeout(profileTimer);
              setProfile(snapshot.exists() ? snapshot.data() : null);
              setSessionError(null);
              setLoading(false);
            },
            (error) => {
              if (active && current === generation) {
                clearTimeout(profileTimer);
                setSessionError(sessionFailure(error, "profile"));
                setLoading(false);
              }
            },
          );
        } catch (error) {
          if (active && current === generation) {
            clearTimeout(profileTimer);
            setSessionError(sessionFailure(error, "auth"));
            setLoading(false);
          }
        }
      },
      (error) => {
        clearTimeout(authTimer);
        if (active) {
          setSessionError(sessionFailure(error, "auth"));
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
      generation++;
      clearTimeout(authTimer);
      clearTimeout(profileTimer);
      stop();
      stopProfile();
    };
  }, [retryVersion]);
  function retrySession() {
    setSessionError(null);
    setLoading(true);
    setRetryVersion((v) => v + 1);
  }
  async function createProfile(current, name) {
    const profileRef = doc(db, "users", current.uid);
    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
          const existing = await transaction.get(profileRef);
          if (existing.exists()) return;
          const statsRef = doc(db, "publicStats", "community");
          const stats = await transaction.get(statsRef);
          const fullName = normalizeName(name || current.displayName);
          const createdAt = serverTimestamp();
          if (stats.exists()) transaction.update(statsRef, {
            registeredStudents: stats.data().registeredStudents + 1,
            updatedAt: serverTimestamp(),
          });
          transaction.set(profileRef, {
            name: fullName,
            onboarding: initialOnboarding(createdAt),
            email: current.email || "",
            college: "",
            degree: "",
            graduationYear: "",
            city: "",
            bio: "",
            skills: [],
            portfolio: "",
            resumePath: "",
            resumeUrl: "",
            createdAt,
            updatedAt: serverTimestamp(),
          });
          transaction.set(doc(db, "adminUsers", current.uid), {
            uid: current.uid,
            fullName,
            joinedAt: createdAt,
            updatedAt: serverTimestamp(),
          });
        }),
        "app/profile-timeout",
      );
    } catch (error) {
      if (
        userRef.current?.uid === current.uid ||
        auth.currentUser?.uid === current.uid
      ) {
        setSessionError(sessionFailure(error, "profile"));
        setLoading(false);
      }
      throw error;
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        profile,
        admin,
        loading,
        sessionError,
        retrySession,
        createProfile,
        logout: () => signOut(auth),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
