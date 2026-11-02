import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useSession } from "./session";
const modules = [
  ["adminUsers", "Synced accounts", "users"],
  ["opportunities", "Opportunities", "listings"],
  ["applications", "Applications", "applications"],
  ["placementContent", "Placement items", "placement"],
];
export function AdminLiveSummary({ open }) {
  const { user, admin } = useSession();
  const [stats, setStats] = useState({});
  useEffect(() => {
    setStats({});
    if (!db || !user || !admin) return;
    let active = true;
    const stops = modules.map(([path]) => onSnapshot(collection(db, path), { includeMetadataChanges: true }, (s) => {
      if (active) setStats(old => ({ ...old, [path]: { count: s.size, cached: s.metadata.fromCache } }));
    }, () => { if (active) setStats(old => ({ ...old, [path]: { error: true } })); }));
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [user?.uid, admin]);
  if (!user || !admin) return null;
  return <div className="admin-live-grid">{modules.map(([path, label, tab]) => <button key={path} className="panel admin-live-card" onClick={() => open(tab)}>
    <span>{label}</span><strong>{stats[path]?.error ? "Unavailable" : stats[path]?.count ?? "—"}</strong>
    <small>{stats[path]?.error ? "Check connection and permissions" : stats[path] ? stats[path].cached ? "Cached · reconnecting" : "Live · view records →" : "Connecting…"}</small>
  </button>)}</div>;
}
