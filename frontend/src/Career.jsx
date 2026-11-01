import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Trash2,
  BookOpen,
  Target,
  Users,
  RefreshCw,
} from "lucide-react";
import { useSession } from "./session";
import { configured } from "./firebase";
import { errorMessage, completion } from "./domain";
import {
  useCareerPage,
  createTask,
  changeTask,
  removeTask,
  saveResource,
  removeResource,
  resourceCategories,
} from "./careerData";

function Feedback({ error, message }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
    </>
  );
}
function PageControls({ data }) {
  return (
    <div className="career-controls">
      {data.error && <p role="alert">{errorMessage(data.error)}</p>}
      <button
        className="button secondary"
        disabled={data.loading}
        onClick={data.refresh}
      >
        <RefreshCw size={15} /> Refresh
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
      {data.loading && <span role="status">Loading…</span>}
    </div>
  );
}
export function CareerPlanner() {
  const { user } = useSession();
  const data = useCareerPage("careerTasks", user.uid);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all");
  async function act(action, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      data.refresh();
    } catch (e) {
      setError(e?.code ? errorMessage(e) : e.message);
    } finally {
      setBusy(false);
    }
  }
  async function add(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    await act(async () => {
      await createTask(user.uid, values);
      form.reset();
    }, "Task added to your plan.");
  }
  const items = data.items.filter(
    (t) => filter === "all" || t.status === filter,
  );
  return (
    <>
      <section className="career-banner">
        <Target size={32} />
        <div>
          <span className="eyebrow">SMALL STEPS. REAL PROGRESS.</span>
          <h2>Your next move starts today.</h2>
          <p>Plan an application, practice a skill or polish your portfolio.</p>
        </div>
        <strong>
          {data.items.filter((t) => t.status === "done").length}
          <small>completed in loaded tasks</small>
        </strong>
      </section>
      <Feedback error={error} message={message} />
      <form className="panel career-form" onSubmit={add}>
        <h2>Add a goal</h2>
        <div className="form-grid">
          <label>
            What will you work on?
            <input
              name="title"
              required
              maxLength={120}
              placeholder="Apply to two design internships"
            />
          </label>
          <label>
            Due date
            <input type="date" name="dueDate" required />
          </label>
        </div>
        <label>
          Notes <span className="muted">(optional)</span>
          <textarea
            name="note"
            maxLength={1000}
            rows={2}
            placeholder="A small, specific next step"
          />
        </label>
        <button className="button" disabled={busy}>
          Add to my plan
        </button>
      </form>
      <div className="type-tabs" aria-label="Task filters">
        {[
          ["all", "All tasks"],
          ["todo", "To do"],
          ["done", "Completed"],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={v === filter ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="task-list">
        {items.map((t) => (
          <article
            className={
              "panel task-row " + (t.status === "done" ? "task-done" : "")
            }
            key={t.id}
          >
            <button
              className="task-toggle"
              disabled={busy}
              aria-label={
                (t.status === "done" ? "Reopen " : "Complete ") + t.title
              }
              onClick={() =>
                act(
                  () => changeTask(t.id, t.status === "done" ? "todo" : "done"),
                  "Progress saved.",
                )
              }
            >
              {t.status === "done" ? <CheckCircle2 /> : <Circle />}
            </button>
            <div>
              <h3>{t.title}</h3>
              <p>{t.note}</p>
              <span
                className={
                  t.status === "todo" &&
                  t.dueDate <
                    [
                      new Date().getFullYear(),
                      String(new Date().getMonth() + 1).padStart(2, "0"),
                      String(new Date().getDate()).padStart(2, "0"),
                    ].join("-")
                    ? "overdue"
                    : ""
                }
              >
                Due {t.dueDate}
              </span>
            </div>
            <button
              className="icon-button"
              disabled={busy}
              aria-label={"Delete " + t.title}
              onClick={() => {
                if (window.confirm("Delete this task?"))
                  act(() => removeTask(t.id), "Task removed.");
              }}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>
      {!items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <Target />
          <h2>A little focus goes a long way.</h2>
          <p>
            Add your first goal above. Your plan is private to your account.
          </p>
        </div>
      )}
      <PageControls data={data} />
    </>
  );
}
export function ResourceLibrary({ manage = false }) {
  const { user } = useSession();
  const data = useCareerPage("resources", null, manage);
  const [category, setCategory] = useState("All"),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null);
  async function save(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveResource(
        user.uid,
        Object.fromEntries(new FormData(form)),
        editing?.id,
      );
      setEditing(null);
      form.reset();
      data.refresh();
      setMessage("Resource saved.");
    } catch (e) {
      setError(e?.code ? errorMessage(e) : e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await removeResource(item.id);
      if (editing?.id === item.id) setEditing(null);
      data.refresh();
      setMessage("Resource deleted.");
    } catch (e) {
      setError(e?.code ? errorMessage(e) : e.message);
    } finally {
      setBusy(false);
    }
  }
  const items = data.items.filter(
    (r) =>
      (category === "All" || r.category === category) &&
      (r.title + " " + r.description)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Feedback error={error} message={message} />
      {manage && (
        <form
          key={editing?.id || "new"}
          className="panel career-form"
          onSubmit={save}
        >
          <h2>{editing ? "Edit resource" : "Publish a learning resource"}</h2>
          <div className="form-grid">
            <label>
              Title
              <input
                name="title"
                required
                maxLength={120}
                defaultValue={editing?.title}
              />
            </label>
            <label>
              HTTPS link
              <input
                name="url"
                type="url"
                pattern="https://.*"
                required
                maxLength={1000}
                defaultValue={editing?.url}
              />
            </label>
            <label>
              Category
              <select name="category" defaultValue={editing?.category}>
                {resourceCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Visibility
              <select name="status" defaultValue={editing?.status || "draft"}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              required
              maxLength={1000}
              rows={3}
              defaultValue={editing?.description}
            />
          </label>
          <div className="career-controls">
            <button className="button" disabled={busy}>
              Save resource
            </button>
            {editing && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      )}
      {!configured && (
        <p className="notice">
          Connect Firebase to publish and browse learning resources.
        </p>
      )}
      <div className="library-filters">
        <label>
          Search loaded resources
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Interview, portfolio, skills…"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All", ...resourceCategories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="resource-grid">
        {items.map((r) => (
          <article className="panel resource-card" key={r.id}>
            <div className="resource-symbol">
              <BookOpen size={24} />
            </div>
            <span className="eyebrow">
              {r.category}
              {manage ? " · " + r.status : ""}
            </span>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            {/^https:\/\//i.test(r.url) && (
              <a
                className="resource-link"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open resource <ArrowUpRight size={17} />
              </a>
            )}
            {manage && (
              <div className="career-controls">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setEditing(r)}
                >
                  Edit
                </button>
                <button
                  className="icon-button"
                  disabled={busy}
                  onClick={() => remove(r)}
                  aria-label={"Delete " + r.title}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <BookOpen />
          <h2>Your next skill is waiting.</h2>
          <p>
            {manage
              ? "Create your first resource above."
              : "No matching resources in the loaded results. Try another category or load more."}
          </p>
        </div>
      )}
      <PageControls data={data} />
    </>
  );
}
export function StudentDirectory() {
  const data = useCareerPage("users", null, true);
  const [search, setSearch] = useState("");
  const students = data.items.filter((s) =>
    (s.name + " " + s.email + " " + s.college)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="career-banner">
        <Users size={32} />
        <div>
          <h2>Know your community.</h2>
          <p>
            Private student profiles. Visible only to verified administrators.
          </p>
        </div>
      </div>
      <label className="directory-search">
        Search loaded students
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email or college"
        />
      </label>
      <div className="student-directory">
        {students.map((s) => (
          <details className="panel student-row" key={s.id}>
            <summary>
              <span className="student-avatar">
                {(s.name || s.email || "S")[0].toUpperCase()}
              </span>
              <span>
                <strong>{s.name || "Profile in progress"}</strong>
                <small>{s.college || "College not added"}</small>
              </span>
              <span className="completion-pill">{completion(s)}% complete</span>
            </summary>
            <dl>
              <dt>Email</dt>
              <dd>{s.email}</dd>
              <dt>Degree</dt>
              <dd>
                {s.degree || "—"} {s.graduationYear}
              </dd>
              <dt>City</dt>
              <dd>{s.city || "—"}</dd>
              <dt>Skills</dt>
              <dd>{s.skills?.join(", ") || "—"}</dd>
              <dt>Bio</dt>
              <dd>{s.bio || "—"}</dd>
              <dt>Notification</dt>
              <dd>
                <Link
                  className="text-link"
                  to={
                    "/admin?tab=notifications&student=" +
                    encodeURIComponent(s.id)
                  }
                >
                  Send notification
                </Link>
              </dd>
              <dt>Student ID</dt>
              <dd>{s.id}</dd>
            </dl>
            {s.portfolio && /^https:\/\//i.test(s.portfolio) && (
              <a href={s.portfolio} target="_blank" rel="noopener noreferrer">
                View portfolio <ArrowUpRight size={15} />
              </a>
            )}
          </details>
        ))}
      </div>
      {!students.length && !data.loading && !data.error && (
        <p>No matching students in the loaded results.</p>
      )}
      <PageControls data={data} />
      <p className="muted">
        Authentication roles and account deletion require a trusted Firebase
        administrator. Browser clients cannot grant admin access.
      </p>
    </>
  );
}
export function CareerSpotlight() {
  return (
    <section className="career-spotlight container">
      <div className="spotlight-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="spotlight-core">
          <Target size={54} />
        </div>
        <span className="float-chip chip-top">
          <CheckCircle2 size={17} /> One step closer
        </span>
        <span className="float-chip chip-bottom">
          <BookOpen size={17} /> Learn. Apply. Grow.
        </span>
      </div>
      <div>
        <span className="eyebrow">MORE THAN A JOB BOARD</span>
        <h2>
          Build a career.
          <br />
          <em>One good habit at a time.</em>
        </h2>
        <p>
          A personal plan, practical learning resources and opportunities that
          move you forward.
        </p>
        <div className="career-controls">
          <Link className="button" to="/planner">
            Make your next move <ArrowUpRight size={17} />
          </Link>
          <Link className="button secondary" to="/learn">
            Explore learning
          </Link>
        </div>
      </div>
    </section>
  );
}
