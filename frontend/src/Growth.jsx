import MentorWorkspace from "./MentorWorkspace";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ArrowUpRight,
  Plus,
  Megaphone,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";
import { useSession } from "./session";
import { configured } from "./firebase";
import { useCareerPage } from "./careerData";
import { httpsLink } from "./communityData";
import { errorMessage } from "./domain";
import {
  mentorTopics,
  updateCategories,
  publishSession,
  sessionStatus,
  saveAnnouncement,
  requestMentoring,
  changeBooking,
  bookingTransitions,
  calendarEvent,
} from "./growthData";
const readable = (e) => (e?.code ? errorMessage(e) : e.message);
function useAction(refresh) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const locked = useRef(false);
  return {
    busy,
    error,
    message,
    run: async (action, success) => {
      if (locked.current) return;
      locked.current = true;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        await action();
        refresh();
        setMessage(success);
      } catch (e) {
        setError(readable(e));
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
  };
}
function Feedback({ action }) {
  return (
    <div aria-live="polite">
      {action.error && (
        <p className="notice" role="alert">
          {action.error}
        </p>
      )}
      {action.message && (
        <p className="notice success" role="status">
          {action.message}
        </p>
      )}
    </div>
  );
}
function Pages({ data }) {
  return (
    <div className="career-controls">
      {data.error && <p role="alert">{readable(data.error)}</p>}
      {data.loading && <span role="status">Loading…</span>}
      <button
        className="button secondary"
        disabled={!configured || data.loading}
        onClick={data.refresh}
      >
        Refresh
      </button>
      {data.more && (
        <button
          className="button"
          disabled={data.loading}
          onClick={data.loadMore}
        >
          Load more
        </button>
      )}
    </div>
  );
}
function SafeLink({ url, children }) {
  try {
    if (!httpsLink(url)) return null;
  } catch {
    return null;
  }
  return (
    <a
      className="button secondary"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
export function sessionTime(s) {
  return (
    s.startsAt
      ?.toDate?.()
      .toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) ||
    "Date unavailable"
  );
}
function CalendarButton({ item }) {
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button secondary"
        onClick={() => {
          try {
            const blob = new Blob([calendarEvent(item)], {
                type: "text/calendar;charset=utf-8",
              }),
              url = URL.createObjectURL(blob),
              link = document.createElement("a");
            link.href = url;
            link.download = "codovate-session.ics";
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setError("");
          } catch (e) {
            setError(readable(e));
          }
        }}
      >
        <CalendarDays size={15} />
        Add to calendar
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function Mentoring({ manage = false }) {
  const { user } = useSession();
  return <MentoringScreen key={user?.uid || "public"} manage={manage} />;
}
function MentoringScreen({ manage }) {
  const { user, profile } = useSession();
  const [params, setParams] = useSearchParams();
  const mine = !!user && !manage && params.get("view") === "mine";
  const data = useCareerPage(
    mine ? "mentorBookings" : "mentorSessions",
    user?.uid,
    manage,
    mine ? "mine" : "default",
  );
  const action = useAction(data.refresh),
    [editor, setEditor] = useState(false),
    [selected, setSelected] = useState(null),
    [search, setSearch] = useState(""),
    [topic, setTopic] = useState("All"),
    [workspace, setWorkspace] = useState(null);
  async function publish(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    await action.run(async () => {
      await publishSession(user.uid, raw);
      setEditor(false);
    }, "Session saved.");
  }
  async function request(e) {
    e.preventDefault();
    const note = new FormData(e.currentTarget).get("note");
    await action.run(async () => {
      await requestMentoring(user, profile, selected.id, note);
      setSelected(null);
      setParams({ view: "mine" });
    }, "Request sent. The administrator will review your booking.");
  }
  const items = data.items.filter(
    (s) =>
      (mine || manage || s.startsAt?.toMillis?.() > Date.now()) &&
      (topic === "All" || mine || s.topic === topic) &&
      (s.title || s.sessionTitle || "")
        .concat(" ", s.mentorName, " ", s.topic || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      {!manage && (
        <section className="mentor-welcome">
          <div>
            <span className="eyebrow">GUIDANCE THAT MOVES YOU FORWARD</span>
            <h2>Bring a question. Build your next step.</h2>
            <p>
              Get a fresh perspective on your project, interview or career. Keep
              your preparation, mentor takeaway and progress together.
            </p>
          </div>
          <ol className="mentor-journey">
            <li>
              <span>01</span>
              <strong>Choose your focus</strong>
              <small>
                Find a session for the challenge you are working on.
              </small>
            </li>
            <li>
              <span>02</span>
              <strong>Come prepared</strong>
              <small>Share a clear goal and your project or portfolio.</small>
            </li>
            <li>
              <span>03</span>
              <strong>Put advice into action</strong>
              <small>
                Follow your private action plan after the conversation.
              </small>
            </li>
          </ol>
        </section>
      )}
      <div className="community-toolbar">
        <div className="type-tabs" role="group" aria-label="Mentoring views">
          {!manage && (
            <>
              <button
                aria-pressed={!mine}
                className={!mine ? "active" : ""}
                onClick={() => {
                  setParams({});
                  setSelected(null);
                }}
              >
                Explore sessions
              </button>
              {user && (
                <button
                  aria-pressed={mine}
                  className={mine ? "active" : ""}
                  onClick={() => {
                    setParams({ view: "mine" });
                    setSelected(null);
                  }}
                >
                  My bookings
                </button>
              )}
            </>
          )}
        </div>
        {manage && (
          <button className="button" onClick={() => setEditor(!editor)}>
            <Plus size={16} />
            Create session
          </button>
        )}
      </div>
      <Feedback action={action} />
      {!configured && (
        <p className="notice">
          Connect Firebase to browse and request mentor sessions.
        </p>
      )}
      {editor && manage && (
        <form className="panel community-form" onSubmit={publish}>
          <h2>Publish a mentor session</h2>
          <fieldset disabled={action.busy}>
            <div className="form-grid">
              <label>
                Session title
                <input autoFocus name="title" required maxLength={120} />
              </label>
              <label>
                Mentor name
                <input name="mentorName" required maxLength={100} />
              </label>
              <label>
                Topic
                <select name="topic">
                  {mentorTopics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Start time (your local time)
                <input type="datetime-local" name="startsAt" required />
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  name="durationMinutes"
                  min={15}
                  max={120}
                  defaultValue={30}
                  required
                />
              </label>
              <label>
                Format
                <select name="format">
                  <option>Online</option>
                  <option>In person</option>
                </select>
              </label>
              <label>
                Location (for in-person sessions)
                <input name="location" maxLength={180} />
              </label>
              <label>
                Visibility
                <select name="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <label>
              Session description
              <textarea name="description" required maxLength={2000} rows={4} />
            </label>
            <p className="hint">
              Start time, mentor and title are fixed after creation. Close an
              incorrect session and create a replacement. Meeting links are
              added privately when confirming bookings.
            </p>
            <div className="career-controls">
              <button className="button">Save session</button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditor(false)}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {selected && (
        <form className="panel community-form" onSubmit={request}>
          <div className="form-heading">
            <h2>Request {selected.title}</h2>
            <button
              type="button"
              aria-label="Close booking form"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
          </div>
          <label>
            What would you like help with?
            <textarea
              autoFocus
              name="note"
              required
              maxLength={1000}
              rows={3}
            />
          </label>
          <p className="hint">
            Your name and note are shared privately with platform
            administrators. A request is not a confirmed appointment.
          </p>
          <button className="button" disabled={action.busy}>
            Send booking request
          </button>
        </form>
      )}
      {!mine && (
        <label className="mentor-topic-filter">
          Session focus
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="All">All topics</option>
            {mentorTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      )}
      <label className="directory-search">
        Search loaded {mine ? "bookings" : "sessions"}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Topic, session or mentor"
        />
      </label>
      <div className="mentoring-grid">
        {items.map((s) => (
          <article className="panel mentor-card" key={s.id}>
            <div className="mentor-card-head">
              <span className="mentor-avatar">{s.mentorName?.slice(0, 1)}</span>
              <span className={"request-state state-" + s.status}>
                {s.status}
              </span>
            </div>
            <span className="eyebrow">{s.topic || s.format}</span>
            <h2>{s.title || s.sessionTitle}</h2>
            <p className="mentor-name">With {s.mentorName}</p>
            <div className="mentor-facts">
              <span>
                <CalendarDays size={15} />
                {sessionTime(s)}
              </span>
              <span>
                <Clock size={15} />
                {s.durationMinutes} minutes · {s.format}
              </span>
            </div>
            <p className="community-summary">{s.description || s.note}</p>
            <p className="hint">{s.location}</p>
            {mine ? (
              <>
                <div className="career-controls">
                  <button
                    className="button"
                    onClick={() =>
                      setWorkspace(workspace === s.id ? null : s.id)
                    }
                    aria-expanded={workspace === s.id}
                  >
                    {workspace === s.id ? "Close workspace" : "Open workspace"}
                  </button>
                  {s.status === "confirmed" && (
                    <>
                      <SafeLink url={s.meetingUrl}>Open meeting</SafeLink>
                      <CalendarButton item={s} />
                    </>
                  )}
                  {["pending", "confirmed"].includes(s.status) && (
                    <button
                      className="text-link"
                      disabled={action.busy}
                      onClick={() => {
                        if (window.confirm("Cancel this booking request?"))
                          action.run(
                            () => changeBooking(s.id, "cancelled"),
                            "Booking cancelled.",
                          );
                      }}
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
                {workspace === s.id && (
                  <MentorWorkspace key={s.id} booking={s} />
                )}
                {s.status === "pending" && (
                  <p className="hint">
                    Awaiting review. This appointment is not yet confirmed.
                  </p>
                )}
              </>
            ) : manage ? (
              <div className="career-controls">
                <label>
                  Publication status
                  <select
                    aria-label={"Session status for " + s.title}
                    value={s.status}
                    disabled={action.busy}
                    onChange={(e) =>
                      action.run(
                        () => sessionStatus(s.id, e.target.value),
                        "Publication updated.",
                      )
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed to new requests</option>
                  </select>
                </label>
              </div>
            ) : s.startsAt?.toMillis?.() > Date.now() ? (
              user ? (
                <button
                  className="button secondary"
                  disabled={action.busy}
                  onClick={() => setSelected(s)}
                >
                  Request a place
                  <ArrowUpRight size={15} />
                </button>
              ) : (
                <Link
                  className="button secondary"
                  to="/login"
                  state={{ from: "/mentoring" }}
                >
                  Sign in to request
                </Link>
              )
            ) : (
              <span className="hint">
                Session has started; requests are closed.
              </span>
            )}
          </article>
        ))}
      </div>
      {!items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <GraduationCap />
          <h2>
            {mine
              ? "Your next conversation starts here."
              : "Good guidance takes shape here."}
          </h2>
          <p>
            {mine
              ? "Request a mentor session to track it here."
              : "No upcoming sessions match this view. Try another topic or check back for the next published session."}
          </p>
        </div>
      )}
      <Pages data={data} />
    </>
  );
}
export function BookingAdmin() {
  const { user } = useSession();
  const data = useCareerPage("mentorBookings", null, true),
    action = useAction(data.refresh);
  const [search, setSearch] = useState(""),
    [workspace, setWorkspace] = useState(null);
  async function review(e, item) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await action.run(
      () =>
        changeBooking(
          item.id,
          form.get("status"),
          form.get("meetingUrl"),
          user.uid,
        ),
      "Booking updated.",
    );
  }
  return (
    <>
      <h2>Mentor booking requests</h2>
      <p className="hint">
        Confirm requests only after checking mentor availability. Online
        confirmations require a meeting link, which remains private to that
        student and administrators.
      </p>
      <Feedback action={action} />
      <label className="directory-search">
        Search loaded booking requests
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Student, mentor or session"
        />
      </label>
      <div className="request-list">
        {data.items
          .filter((b) =>
            (b.studentName + " " + b.sessionTitle + " " + b.mentorName)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((b) => (
            <article className="panel request-card" key={b.id}>
              <div className="request-heading">
                <div>
                  <h3>
                    {b.studentName} · {b.sessionTitle}
                  </h3>
                  <span>
                    {sessionTime(b)} · {b.mentorName}
                  </span>
                </div>
                <span className={"request-state state-" + b.status}>
                  {b.status}
                </span>
              </div>
              <p className="community-summary">{b.note}</p>
              <button
                className="button secondary"
                aria-expanded={workspace === b.id}
                onClick={() => setWorkspace(workspace === b.id ? null : b.id)}
              >
                {workspace === b.id
                  ? "Close workspace"
                  : "Preparation & action plan"}
              </button>
              {workspace === b.id && (
                <MentorWorkspace key={b.id} booking={b} manage />
              )}

              {bookingTransitions[b.status]?.length > 0 && (
                <form className="booking-review" onSubmit={(e) => review(e, b)}>
                  <label>
                    Decision
                    <select
                      name="status"
                      aria-label={"Decision for " + b.studentName}
                    >
                      {bookingTransitions[b.status].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    HTTPS meeting link (online confirmation)
                    <input
                      name="meetingUrl"
                      type="url"
                      pattern="https://.*"
                      maxLength={500}
                      defaultValue={b.meetingUrl}
                    />
                  </label>
                  <button className="button" disabled={action.busy}>
                    Save decision
                  </button>
                </form>
              )}
            </article>
          ))}
      </div>
      {!data.items.length && !data.loading && !data.error && (
        <p>No booking requests yet.</p>
      )}
      <Pages data={data} />
    </>
  );
}
export function Updates({ manage = false }) {
  const { user } = useSession();
  const data = useCareerPage("announcements", null, manage),
    action = useAction(data.refresh);
  const [editing, setEditing] = useState(null),
    [category, setCategory] = useState("All");
  const visibleItems = data.items.filter(
    (a) => category === "All" || a.category === category,
  );
  async function save(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    await action.run(async () => {
      await saveAnnouncement(user.uid, raw, editing?.id);
      setEditing(null);
    }, "Update saved.");
  }
  return (
    <>
      <Feedback action={action} />
      {manage && (
        <button className="button" onClick={() => setEditing({})}>
          <Plus size={16} />
          Write an update
        </button>
      )}
      {editing && manage && (
        <form
          key={editing.id || "new"}
          className="panel community-form"
          onSubmit={save}
        >
          <h2>{editing.id ? "Edit update" : "Write an update"}</h2>
          <fieldset disabled={action.busy}>
            <label>
              Title
              <input
                autoFocus
                name="title"
                required
                maxLength={120}
                defaultValue={editing.title}
              />
            </label>
            <div className="form-grid">
              <label>
                Category
                <select name="category" defaultValue={editing.category}>
                  {updateCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Visibility
                <select name="status" defaultValue={editing.status || "draft"}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <label>
              Message
              <textarea
                name="body"
                rows={5}
                required
                maxLength={3000}
                defaultValue={editing.body}
              />
            </label>
            <label>
              HTTPS link (optional)
              <input
                name="link"
                type="url"
                pattern="https://.*"
                maxLength={500}
                defaultValue={editing.link}
              />
            </label>
            <div className="career-controls">
              <button className="button">Save update</button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {!configured && (
        <p className="notice">Connect Firebase to read platform updates.</p>
      )}
      <div
        className="type-tabs growth-tabs"
        role="group"
        aria-label="Update categories"
      >
        {["All", ...updateCategories].map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="updates-list">
        {visibleItems.map((a) => (
          <article className="panel update-card" key={a.id}>
            <span className="update-symbol">
              <Megaphone size={20} />
            </span>
            <div>
              <span className="eyebrow">
                {a.category}
                {manage ? " · " + a.status : ""}
              </span>
              <h2>{a.title}</h2>
              <p className="community-summary">{a.body}</p>
              <div className="career-controls">
                <SafeLink url={a.link}>Read more</SafeLink>
                {manage && (
                  <button
                    className="text-link"
                    disabled={action.busy}
                    onClick={() => setEditing(a)}
                  >
                    Edit update
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleItems.length && !data.loading && !data.error && (
        <div className="career-empty">
          <Megaphone />
          <h2>A fresh chapter is on its way.</h2>
          <p>Published updates will appear here. Check back for what’s next.</p>
        </div>
      )}
      <Pages data={data} />
    </>
  );
}
