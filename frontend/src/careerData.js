import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { withTimeout } from "./authSupport";

export const PAGE_SIZE = 24;
export const resourceCategories = [
  "Interview prep",
  "Resume & portfolio",
  "Technical skills",
  "Career guidance",
];
export function taskInput(title, note, dueDate) {
  const value = { title: title.trim(), note: note.trim(), dueDate };
  if (
    !value.title ||
    value.title.length > 120 ||
    value.note.length > 1000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    Number.isNaN(Date.parse(dueDate + "T00:00:00Z")) ||
    new Date(dueDate + "T00:00:00Z").toISOString().slice(0, 10) !== dueDate
  )
    throw new Error(
      "Add a title, a valid due date and a note of up to 1,000 characters.",
    );
  return value;
}
export function resourceInput(data) {
  const value = Object.fromEntries(
    ["title", "description", "url", "category", "status"].map((k) => [
      k,
      String(data[k] || "").trim(),
    ]),
  );
  let url;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error("Enter a valid HTTPS resource link.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    value.url.length > 1000
  )
    throw new Error("Enter a valid HTTPS resource link.");
  if (
    !value.title ||
    value.title.length > 120 ||
    !value.description ||
    value.description.length > 1000 ||
    !resourceCategories.includes(value.category) ||
    !["published", "draft"].includes(value.status)
  )
    throw new Error(
      "Complete the resource title, description, category and visibility.",
    );
  return value;
}
// Each request is bounded. The cursor is an actual Firestore snapshot, never a client offset.
export function useCareerPage(
  kind,
  uid,
  admin = false,
  scope = "default",
  teamId = "",
) {
  const [state, setState] = useState({
    requestKey: "",
    items: [],
    loading: !!db,
    error: null,
    more: false,
  });
  const [cursor, setCursor] = useState(null),
    [revision, setRevision] = useState(0);
  const [paging, setPaging] = useState({ key: "", cursor: null });
  const [teamLimit, setTeamLimit] = useState({ scope: "", size: PAGE_SIZE });
  const teamKey = [uid || "", admin, scope].join(":");
  const shownTeams = teamLimit.scope === teamKey ? teamLimit.size : PAGE_SIZE;
  const key = [
    kind,
    uid || "",
    admin,
    scope,
    teamId,
    revision,
    kind === "teams" ? shownTeams : "",
  ].join(":");
  const page = paging.key === key ? paging.cursor : null;
  useEffect(() => {
    let active = true;
    setState((s) => ({
      ...s,
      requestKey: key,
      ...(page ? {} : { items: [], more: false }),
      loading: !!db,
      error: null,
    }));
    if (
      !db ||
      (((["careerTasks", "mentorBookings", "notifications"].includes(kind) &&
        !admin) ||
        scope === "mine" ||
        (kind === "teamRequests" && scope !== "incoming")) &&
        !uid) ||
      (kind === "teamRequests" && scope === "incoming" && !teamId)
    ) {
      setState({
        requestKey: key,
        items: [],
        loading: false,
        error: null,
        more: false,
      });
      return;
    }
    const filters = [];
    if (kind === "mentorBookings" && scope === "assigned" && !admin)
      filters.push(where("mentorUid", "==", uid));
    else if (
      (["careerTasks", "mentorBookings", "notifications"].includes(kind) &&
        !admin) ||
      (["projects", "teams"].includes(kind) && scope === "mine") ||
      (kind === "teamRequests" && scope !== "incoming")
    )
      filters.push(where("studentId", "==", uid));
    else if (kind === "teamRequests") {
      filters.push(where("teamId", "==", teamId));
      if (!admin) filters.push(where("ownerId", "==", uid));
    } else if (kind === "projects" && !admin)
      filters.push(
        where("visibility", "==", "public"),
        where("moderation", "==", "visible"),
      );
    else if (kind === "teams" && !admin)
      filters.push(where("status", "==", "open"));
    else if (
      [
        "resources",
        "opportunities",
        "mentorSessions",
        "announcements",
      ].includes(kind) &&
      !admin
    )
      filters.push(where("status", "==", "published"));
    if (kind === "teams") {
      const timer = setTimeout(() => {
        if (active)
          setState((s) => ({
            ...s,
            loading: false,
            error: { code: "app/data-timeout" },
            more: false,
          }));
      }, 12000);
      const stop = onSnapshot(
        query(
          collection(db, kind),
          ...filters,
          orderBy("createdAt", "desc"),
          limit(shownTeams + 1),
        ),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!active) return;
          const docs = snapshot.docs.slice(0, shownTeams);
          if (!snapshot.metadata.fromCache || docs.length) clearTimeout(timer);
          setState({
            requestKey: key,
            items: docs.map((d) => ({ ...d.data(), id: d.id })),
            loading: snapshot.metadata.fromCache && docs.length === 0,
            error: null,
            more: snapshot.size > shownTeams,
          });
        },
        (error) => {
          clearTimeout(timer);
          if (active)
            setState({
              requestKey: key,
              items: [],
              loading: false,
              error,
              more: false,
            });
        },
      );
      return () => {
        active = false;
        clearTimeout(timer);
        stop();
      };
    }
    withTimeout(
      getDocs(
        query(
          collection(db, kind),
          ...filters,
          orderBy("createdAt", "desc"),
          ...(page ? [startAfter(page)] : []),
          limit(PAGE_SIZE + 1),
        ),
      ),
      "app/data-timeout",
    )
      .then((s) => {
        if (!active) return;
        const docs = s.docs.slice(0, PAGE_SIZE);
        setCursor(docs.at(-1) || null);
        setState((old) => ({
          requestKey: key,
          items: page
            ? [
                ...old.items,
                ...docs
                  .filter((d) => !old.items.some((item) => item.id === d.id))
                  .map((d) => ({ ...d.data(), id: d.id })),
              ]
            : docs.map((d) => ({ ...d.data(), id: d.id })),
          loading: false,
          error: null,
          more: s.size > PAGE_SIZE,
        }));
      })
      .catch((error) => {
        if (active) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      active = false;
    };
  }, [key, page, kind, uid, admin, scope, teamId, shownTeams]);
  const visible =
    state.requestKey === key
      ? state
      : { items: [], loading: !!db, error: null, more: false };
  return {
    ...visible,
    refresh: () => setRevision((n) => n + 1),
    loadMore: () => {
      if (kind === "teams") {
        setTeamLimit({ scope: teamKey, size: shownTeams + PAGE_SIZE });
        return;
      }
      if (cursor && !state.loading) setPaging({ key, cursor });
    },
  };
}
export async function createTask(uid, values) {
  if (!db || !uid) throw new Error("Sign in to use your planner.");
  return addDoc(collection(db, "careerTasks"), {
    ...taskInput(values.title, values.note, values.dueDate),
    studentId: uid,
    status: "todo",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function changeTask(id, status) {
  if (!["todo", "done"].includes(status))
    throw new Error("Invalid task status.");
  await updateDoc(doc(db, "careerTasks", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
export const removeTask = (id) => deleteDoc(doc(db, "careerTasks", id));
export async function saveResource(uid, data, id) {
  const value = resourceInput(data);
  if (id)
    return updateDoc(doc(db, "resources", id), {
      ...value,
      updatedAt: serverTimestamp(),
    });
  return addDoc(collection(db, "resources"), {
    ...value,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export const removeResource = (id) => deleteDoc(doc(db, "resources", id));
