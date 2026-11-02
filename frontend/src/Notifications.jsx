import { AdminLiveSummary } from "./AdminLiveSummary";
import { useRef, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import { Bell } from "lucide-react";
import { useSession } from "./session";
import { configured } from "./firebase";
import { useCareerPage } from "./careerData";
import { errorMessage } from "./domain";
import {
  notificationLinks,
  sendNotification,
  markNotification,
  newNotificationId,
  useUnreadNotification,
} from "./notificationData";
const readable = (e) => (e?.code ? errorMessage(e) : e.message);
export function NotificationNav() {
  const { user } = useSession();
  const { unread, error } = useUnreadNotification(user?.uid);
  if (!user) return null;
  return (
    <NavLink to="/notifications">
      <Bell size={18} /> Notifications{unread ? " · New" : ""}
      {error ? " · Refresh inbox" : ""}
    </NavLink>
  );
}
export function Notifications({ manage = false }) {
  const { user } = useSession();
  return (
    <NotificationScreen key={(user?.uid || "guest") + manage} manage={manage} />
  );
}
function NotificationScreen({ manage }) {
  const { user } = useSession();
  const [params] = useSearchParams();
  const data = useCareerPage("notifications", user?.uid, manage);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false),
    draftId = useRef(null);
  async function action(fn, success) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      data.refresh();
      setMessage(success);
    } catch (e) {
      setError(readable(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    action(async () => {
      draftId.current ||= newNotificationId();
      await sendNotification(user.uid, raw, draftId.current);
      draftId.current = null;
      form.reset();
    }, "Notification delivered to the student's inbox.");
  }
  return (
    <>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice success">
            {message}
          </p>
        )}
      </div>
      {manage && (
        <form
          className="panel community-form"
          onSubmit={submit}
          onChange={() => {
            draftId.current = null;
          }}
        >
          <h2>Send a student notification</h2>
          <p>
            Use a student ID shared by the student. For public news, publish a
            platform update.
          </p>
          <fieldset disabled={busy || !configured}>
            <label>
              Student ID
              <input
                name="studentId"
                defaultValue={params.get("student") || ""}
                required
                maxLength={128}
                pattern="[A-Za-z0-9_-]+"
              />
            </label>
            <label>
              Title
              <input name="title" required maxLength={120} />
            </label>
            <label>
              Message
              <textarea name="body" required maxLength={2000} rows={4} />
            </label>
            <label>
              Open page
              <select name="link">
                {notificationLinks.map((p) => (
                  <option key={p} value={p}>
                    {p || "No link"}
                  </option>
                ))}
              </select>
            </label>
            <button className="button">
              {busy ? "Sending…" : "Send notification"}
            </button>
          </fieldset>
        </form>
      )}
      <p className="hint">
        {manage
          ? "Sent notification history. Messages cannot be edited after delivery."
          : "Your private inbox. New notifications appear in the navigation; refresh to load them here."}{" "}
        In-app notifications only.
      </p>
      {!configured && (
        <p className="notice">Connect Firebase to use notifications.</p>
      )}
      <div className="updates-list">
        {data.items.map((n) => (
          <article key={n.id} className="panel update-card">
            <Bell size={20} />
            <div>
              <span className="eyebrow">
                {n.read ? "Read" : "Unread"}
                {manage ? " · " + n.studentId : ""}
              </span>
              <h2>{n.title}</h2>
              <p className="community-summary">{n.body}</p>
              <p className="hint">
                {n.createdAt?.toDate?.().toLocaleString() || "Saving…"}
              </p>
              <div className="career-controls">
                {n.link && notificationLinks.includes(n.link) && (
                  <Link className="button secondary" to={n.link}>
                    Open page
                  </Link>
                )}
                {!manage && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      action(
                        () => markNotification(n.id, !n.read),
                        n.read ? "Marked unread." : "Marked read.",
                      )
                    }
                  >
                    {n.read ? "Mark unread" : "Mark read"}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!data.items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <Bell />
          <h2>
            {manage ? "No notifications sent yet." : "You're all caught up."}
          </h2>
        </div>
      )}
      {data.error && (
        <p role="alert" className="notice">
          {readable(data.error)}
        </p>
      )}
      {data.loading && <p role="status">Loading…</p>}
      <div className="career-controls">
        <button
          className="button secondary"
          onClick={data.refresh}
          disabled={!configured || data.loading}
        >
          Refresh
        </button>
        {data.more && (
          <button
            className="button"
            onClick={data.loadMore}
            disabled={data.loading}
          >
            Load more
          </button>
        )}
      </div>
    </>
  );
}
export function AdminOverview({ open }) {
  const { user } = useSession();
  const sections = [
    [
      "users",
      "User accounts & access",
      "Manage registered accounts and administrator access.",
    ],
    [
      "system",
      "System settings",
      "Check configuration and live Firestore connectivity.",
    ],
    ["listings", "Opportunities", "Edit, publish and close listings."],
    [
      "placement",
      "Placement preparation",
      "Review Aptitude sources, organize lessons and edit practice questions.",
    ],
    ["applications", "Applications", "Review submissions and update outcomes."],
    ["students", "Student privacy", "Review the student privacy policy."],
    [
      "notifications",
      "Notifications",
      "Send private messages and review delivery history.",
    ],
    [
      "bookings",
      "Mentor bookings",
      "Confirm sessions and share private meeting links.",
    ],
    ["mentoring", "Mentor sessions", "Publish guidance sessions."],
    ["updates", "Platform updates", "Publish news for the whole community."],
    ["resources", "Learning resources", "Manage curated learning links."],
    ["projects", "Project moderation", "Review student portfolios."],
    ["teams", "Team moderation", "Review team discovery posts."],
  ];
  return (
    <>
      <AdminLiveSummary open={open} />
      <section className="panel community-form">
        <h2>Codovate control centre</h2>
        <p>Signed in as {user?.email} · Verified administrator</p>
        <p>
          Choose a module below. Account roles and deletion remain in trusted
          Firebase administration.
        </p>
      </section>
      <div className="resource-grid">
        {sections.map(([key, title, description]) => (
          <section key={key} className="panel resource-card">
            <h2>{title}</h2>
            <p>{description}</p>
            <button className="button secondary" onClick={() => open(key)}>
              Manage {title.toLowerCase()}
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
