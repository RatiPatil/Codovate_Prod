import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useSession } from "./session";
import { withTimeout } from "./authSupport";
export function AptitudeLearningSummary({ items, view }) {
  const { user } = useSession();
  const [state, setState] = useState({ uid: "", rows: [], error: false });
  useEffect(() => {
    let active = true;
    setState({ uid: "", rows: [], error: false });
    if (!db || !user) return;
    withTimeout(
      getDocs(
        query(
          collection(db, "placementProgress"),
          where("studentId", "==", user.uid),
          limit(100),
        ),
      ),
      "placement/summary-timeout",
    )
      .then((s) => {
        if (active)
          setState({
            uid: user.uid,
            rows: s.docs.map((d) => d.data()),
            error: false,
          });
      })
      .catch(() => {
        if (active) setState({ uid: user.uid, rows: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [user?.uid, view]);
  if (!user || state.uid !== user.uid) return null;
  if (state.error)
    return (
      <p className="notice">
        Your learning summary is unavailable. Lessons are still available.
      </p>
    );
  const rows = state.rows
    .filter((r) =>
      items.some((i) => i.id === r.lessonId && i.kind === "article"),
    )
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  if (!rows.length) return null;
  const recent = rows.find((r) => !r.completed) || rows[0],
    bookmarks = rows.filter((r) => r.bookmarked).slice(0, 5);
  const title = (id) => items.find((i) => i.id === id)?.title;
  return (
    <aside
      className="panel apt-learning-summary"
      aria-label="Your recent learning"
    >
      <h3>Your recent learning</h3>
      <p>
        {rows.filter((r) => r.completed).length} completed in your recent
        records · Your notes and results stay private.
      </p>
      <Link
        className="button secondary"
        to={"/placement?section=aptitude&article=" + recent.lessonId}
      >
        Continue: {title(recent.lessonId)}
      </Link>
      {bookmarks.length > 0 && (
        <>
          <h4>Bookmarked lessons</h4>
          <ul>
            {bookmarks.map((r) => (
              <li key={r.lessonId}>
                <Link to={"/placement?section=aptitude&article=" + r.lessonId}>
                  {title(r.lessonId)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
