import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Search, Users } from "lucide-react";
import { db } from "./firebase";
import { useSession } from "./session";
export const nameSearch = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
export function AdminUserDirectory({ selectUser }) {
  const { user, admin } = useSession();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [state, setState] = useState({
      owner: "",
      rows: [],
      loading: true,
      error: "",
      cached: true,
    });
  useEffect(() => {
    setState({ owner: "", rows: [], loading: !!db, error: "", cached: true });
    if (!db || !admin || !user) return;
    let active = true;
    const stop = onSnapshot(
      collection(db, "adminUsers"),
      { includeMetadataChanges: true },
      (snap) => {
        if (active)
          setState({
            owner: user.uid,
            rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
            loading: false,
            error: "",
            cached: !!snap.metadata?.fromCache,
          });
      },
      () => {
        if (active)
          setState({
            owner: user.uid,
            rows: [],
            loading: false,
            error:
              "Could not load the user directory. Check the deployed directory rules and your administrator session.",
            cached: true,
          });
      },
    );
    return () => {
      active = false;
      stop();
    };
  }, [user?.uid, admin]);
  if (!admin) return null;
  const ready = state.owner === user?.uid,
    rows = ready ? state.rows : [],
    needle = nameSearch(search),
    filtered = rows
      .filter(
        (r) =>
          nameSearch(r.fullName).includes(needle) ||
          nameSearch(r.uid).includes(needle),
      )
      .sort(
        (a, b) =>
          (a.fullName || "").localeCompare(b.fullName || "", "en", {
            sensitivity: "base",
          }) || a.uid.localeCompare(b.uid),
      );
  const pages = Math.max(1, Math.ceil(filtered.length / 30)),
    current = Math.min(page, pages - 1),
    visible = filtered.slice(current * 30, (current + 1) * 30);
  return (
    <section
      className="panel admin-user-directory"
      aria-label="Registered user directory"
    >
      <div className="admin-directory-heading">
        <div>
          <h2>
            <Users size={22} /> Registered users
          </h2>
          <p>
            Full names and account UIDs. Contact details and private learning
            notes stay protected.
          </p>
        </div>
        <div className="admin-user-count">
          <strong>
            {!db || !ready || state.loading || state.error
              ? "—"
              : rows.length.toLocaleString("en-IN")}
          </strong>
          <span>Synced accounts</span>
        </div>
      </div>
      {!db ? (
        <p className="notice">Connect Firebase to load registered users.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !ready || state.loading ? (
        <p role="status">Loading users…</p>
      ) : (
        <>
          <p className="admin-directory-live" role="status">
            {state.cached
              ? "Cached directory · reconnecting to Firebase"
              : "Live directory · updates automatically"}
          </p>
          <label className="admin-directory-search">
            <span>
              <Search size={16} /> Search users
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search full name or user UID"
            />
          </label>
          <p className="hint">
            {filtered.length.toLocaleString("en-IN")} matching account
            {filtered.length === 1 ? "" : "s"}
          </p>
          {rows.length === 0 ? (
            <div className="career-empty">
              <h3>Sync existing accounts to show their names</h3>
              <p>
                Run the trusted directory sync once to include previously
                registered and imported accounts.
              </p>
              <code>
                node scripts/sync-admin-directory.mjs --project=codovate-dev
                --apply
              </code>
            </div>
          ) : visible.length === 0 ? (
            <p>No users match your search.</p>
          ) : (
            <div className="admin-directory-table">
              <table>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>User UID</th>
                    <th>Joined</th>
                    <th>Access tools</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.uid}>
                      <td>
                        <strong>{r.fullName || "Name not provided"}</strong>
                      </td>
                      <td>
                        <code>{r.uid}</code>
                      </td>
                      <td>
                        {r.joinedAt?.toDate?.().toLocaleDateString("en-IN") ||
                          "Not available"}
                      </td>
                      <td>
                        <a
                          href="#admin-access-tools"
                          onClick={() => selectUser(r.uid)}
                        >
                          Select account
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 30 && (
            <div className="admin-directory-pagination">
              <button
                className="button secondary small"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </button>
              <span>
                Page {current + 1} of {pages}
              </span>
              <button
                className="button secondary small"
                disabled={current === pages - 1}
                onClick={() => setPage(current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <p className="hint">
        New registrations and name edits made through Codovate update this
        directory live. After bulk imports or changes made directly in Firebase
        Console, rerun the trusted directory sync. This count is registered
        accounts in the synced directory, not active students.
      </p>
    </section>
  );
}
