import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Code2,
  Users,
  Plus,
  X,
  LockKeyhole,
  Globe2,
  Layers,
  Check,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { configured, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { withTimeout } from "./authSupport";
import { useSession } from "./session";
import { useCareerPage } from "./careerData";
import { errorMessage } from "./domain";
import {
  projectCategories,
  httpsLink,
  saveCommunity,
  deleteProject,
  moderateCommunity,
  requestTeam,
  reviewRequest,
} from "./communityData";

function readable(e) {
  return e?.code ? errorMessage(e) : e?.message || "Please try again.";
}
function Feedback({ error, message }) {
  return (
    <div aria-live="polite">
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
function Pagination({ data }) {
  return (
    <div className="career-controls">
      {data.error && <p role="alert">{readable(data.error)}</p>}
      <button
        className="button secondary"
        disabled={data.loading || !configured}
        onClick={data.refresh}
      >
        <RefreshCw size={15} />
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
      {data.loading && <span role="status">Loading…</span>}
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
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
function CommunityForm({ kind, editing, onSubmit, busy, onCancel }) {
  const project = kind === "projects";
  return (
    <form className="panel community-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">
            {project ? "YOUR WORK, YOUR STORY" : "FIND YOUR PEOPLE"}
          </span>
          <h2>
            {editing ? "Edit " : project ? "Add a project" : "Start a team"}
            {editing ? (project ? "project" : "team") : ""}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close editor"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={18} />
        </button>
      </div>
      <div className="form-grid">
        <label>
          Title
          <input
            autoFocus
            name="title"
            required
            maxLength={120}
            defaultValue={editing?.title}
            placeholder={
              project ? "Campus energy dashboard" : "Build a better campus"
            }
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={editing?.category}>
            {projectCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {project ? "What did you build?" : "What are you building?"}
        <textarea
          name="summary"
          required
          maxLength={2000}
          rows={4}
          defaultValue={editing?.summary}
          placeholder="Explain the problem, your approach and what comes next."
        />
      </label>
      <label>
        Skills (comma separated)
        <input
          name="skills"
          maxLength={1200}
          defaultValue={editing?.skills?.join(", ")}
          placeholder="React, Figma, Python"
        />
      </label>
      {project ? (
        <>
          <div className="form-grid">
            <label>
              Repository link (optional)
              <input
                name="repoUrl"
                type="url"
                pattern="https://.*"
                maxLength={500}
                defaultValue={editing?.repoUrl}
                placeholder="https://github.com/…"
              />
            </label>
            <label>
              Demo link (optional)
              <input
                name="demoUrl"
                type="url"
                pattern="https://.*"
                maxLength={500}
                defaultValue={editing?.demoUrl}
                placeholder="https://…"
              />
            </label>
          </div>
          <label>
            Visibility
            <select
              name="visibility"
              defaultValue={editing?.visibility || "private"}
            >
              <option value="private">
                Private — only you and administrators
              </option>
              <option value="public">
                Public — anyone can view in the showcase
              </option>
            </select>
          </label>
          <p className="hint">
            Public projects share your profile name, project text, skills and
            links. Your email and résumé are never included.
          </p>
        </>
      ) : (
        <>
          <label>
            Who are you looking for?
            <input
              name="lookingFor"
              required
              maxLength={180}
              defaultValue={editing?.lookingFor}
              placeholder="A frontend developer and someone who loves design"
            />
          </label>
          <label>
            Recruiting status
            <select name="status" defaultValue={editing?.status || "open"}>
              <option value="open">Open to requests</option>
              <option value="closed">Recruitment closed</option>
            </select>
          </label>
          <p className="hint">
            Your name and team brief are visible to signed-in students. Join
            requests stay private to the applicant, owner and administrators.
          </p>
        </>
      )}
      <div className="career-controls">
        <button className="button" disabled={busy || !configured}>
          {busy ? "Saving…" : "Save " + (project ? "project" : "team")}
          <Check size={15} />
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
export function Projects({ manage = false }) {
  const { user } = useSession();
  return <ProjectsScreen key={user?.uid || "public"} manage={manage} />;
}
function ProjectsScreen({ manage = false }) {
  const { user, profile } = useSession();
  const [params, setParams] = useSearchParams();
  const scope = manage
    ? "all"
    : params.get("view") === "mine"
      ? "mine"
      : "public";
  const data = useCareerPage("projects", user?.uid, manage, scope);
  const [editor, setEditor] = useState(null),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function act(action, success) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      data.refresh();
      setMessage(success);
    } catch (e) {
      setError(readable(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    await act(async () => {
      await saveCommunity(
        "projects",
        user,
        profile,
        raw,
        editor?.id ? editor : null,
      );
      setEditor(null);
      if (!manage) setParams({ view: "mine" });
    }, "Project saved.");
  }
  const items = data.items.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (p.title + " " + p.summary + " " + p.skills.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <section className="community-hero project-hero">
        <div>
          <span className="eyebrow">PROOF OF WHAT YOU CAN DO</span>
          <h2>
            Let your work
            <br />
            <em>do the talking.</em>
          </h2>
          <p>
            A portfolio starts with one project. Share your approach, not just
            the result.
          </p>
        </div>
        <div className="community-art" aria-hidden="true">
          <div className="art-sheet sheet-back" />
          <div className="art-sheet sheet-front">
            <Code2 size={38} />
            <span />
            <span />
            <i />
          </div>
          <span className="art-badge">
            <Layers size={19} />
            Built by you
          </span>
        </div>
      </section>
      <div className="community-toolbar">
        <div className="type-tabs" role="group" aria-label="Project views">
          {!manage && (
            <>
              <button
                className={scope === "public" ? "active" : ""}
                aria-pressed={scope === "public"}
                onClick={() => {
                  setParams({});
                  setEditor(null);
                }}
              >
                Student showcase
              </button>
              {user && (
                <button
                  className={scope === "mine" ? "active" : ""}
                  aria-pressed={scope === "mine"}
                  onClick={() => {
                    setParams({ view: "mine" });
                    setEditor(null);
                  }}
                >
                  My projects
                </button>
              )}
            </>
          )}
        </div>
        {user ? (
          <button
            className="button"
            disabled={!configured || busy}
            onClick={() => setEditor({})}
          >
            <Plus size={16} />
            Add project
          </button>
        ) : (
          <Link
            className="button"
            to="/login"
            state={{ from: "/projects?view=mine" }}
          >
            Build my portfolio
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <Feedback error={error} message={message} />
      {!configured && (
        <p className="notice">
          Connect Firebase to save projects and browse the student showcase.
        </p>
      )}
      {editor && (
        <CommunityForm
          key={editor.id || "new"}
          kind="projects"
          editing={editor.id ? editor : null}
          onSubmit={save}
          busy={busy}
          onCancel={() => setEditor(null)}
        />
      )}
      <div className="library-filters">
        <label>
          Search loaded projects
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Project, skill or idea"
          />
        </label>
        <label>
          Project category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All", ...projectCategories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="project-grid">
        {items.map((p) => (
          <article className="panel project-card" key={p.id}>
            <div
              className={
                "project-cover cover-" + projectCategories.indexOf(p.category)
              }
              aria-hidden="true"
            >
              <Code2 size={42} />
              <span>{p.category}</span>
            </div>
            <div className="project-body">
              <div className="project-meta">
                <span>{p.studentName}</span>
                <span>
                  {p.visibility === "private" ? (
                    <LockKeyhole size={13} />
                  ) : (
                    <Globe2 size={13} />
                  )}{" "}
                  {p.moderation === "hidden" ? "Hidden by admin" : p.visibility}
                </span>
              </div>
              <Link className="project-title-link" to={"/projects/" + p.id}>
                <h2>{p.title}</h2>
              </Link>
              <p className="community-summary">{p.summary}</p>
              <div className="skill-row">
                {p.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="project-links">
                <SafeLink url={p.repoUrl}>Repository</SafeLink>
                <SafeLink url={p.demoUrl}>Live demo</SafeLink>
              </div>
              {(p.studentId === user?.uid || manage) && (
                <div className="card-actions">
                  <button
                    disabled={busy || (p.moderation === "hidden" && !manage)}
                    onClick={() => setEditor(p)}
                  >
                    Edit
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Permanently delete this project?"))
                        act(async () => {
                          await deleteProject(p.id);
                          if (editor?.id === p.id) setEditor(null);
                        }, "Project deleted.");
                    }}
                  >
                    Delete
                  </button>
                  {manage && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        act(
                          () =>
                            moderateCommunity(
                              "projects",
                              p.id,
                              p.moderation === "hidden" ? "visible" : "hidden",
                            ),
                          "Moderation updated.",
                        )
                      }
                    >
                      <ShieldCheck size={14} />
                      {p.moderation === "hidden" ? "Restore" : "Hide"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {!items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <Code2 />
          <h2>
            {scope === "mine"
              ? "Your first project belongs here."
              : "Great work starts somewhere."}
          </h2>
          <p>
            {scope === "mine"
              ? "Add what you built, the skills you used and a link to try it."
              : "No matching projects in the loaded results. Try another filter or load more."}
          </p>
        </div>
      )}
      <Pagination data={data} />
    </>
  );
}
function JoinForm({ team, busy, onCancel, onSubmit }) {
  return (
    <form className="panel join-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <h2>Join {team.title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close request"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={17} />
        </button>
      </div>
      <label>
        Introduce yourself
        <textarea
          autoFocus
          name="note"
          required
          maxLength={1000}
          rows={4}
          placeholder="What can you bring to this team, and what would you like to learn?"
        />
      </label>
      <p className="hint">
        Your profile name and this note will be shared with the team owner and
        administrators. Avoid private contact details. This sends a request;
        acceptance is the owner's decision.
      </p>
      <div className="career-controls">
        <button className="button" disabled={busy}>
          {busy ? "Sending…" : "Send join request"}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
function TeamRequests({ team, incoming = false, manage = false, onClose }) {
  const { user } = useSession();
  const data = useCareerPage(
    "teamRequests",
    user.uid,
    manage,
    incoming ? "incoming" : "mine",
    team?.id || "",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function decide(id, status) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await reviewRequest(id, status);
      data.refresh();
      setMessage("Request " + status + ".");
    } catch (e) {
      setError(readable(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="team-requests">
      <div className="form-heading">
        <div>
          <span className="eyebrow">
            {incoming ? "OWNER INBOX" : "YOUR REQUESTS"}
          </span>
          <h2>
            {incoming
              ? "Requests for " + team.title
              : "Keep your next collaboration in sight."}
          </h2>
        </div>
        {incoming && (
          <button className="button secondary" onClick={onClose}>
            Back to teams
          </button>
        )}
      </div>
      <Feedback error={error} message={message} />
      <div className="request-list">
        {data.items.map((r) => (
          <article className="panel request-card" key={r.id}>
            <div className="request-heading">
              <div>
                <h3>{incoming ? r.studentName : r.teamTitle}</h3>
                <span>{incoming ? "Team applicant" : "Your join request"}</span>
              </div>
              <span className={"request-state state-" + r.status}>
                {r.status}
              </span>
            </div>
            <p className="community-summary">{r.note}</p>
            {incoming && r.status === "pending" ? (
              <div className="career-controls">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => decide(r.id, "accepted")}
                >
                  Accept request
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => decide(r.id, "declined")}
                >
                  Decline
                </button>
              </div>
            ) : (
              !incoming &&
              ["pending", "accepted"].includes(r.status) && (
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Withdraw this team request?"))
                      decide(r.id, "withdrawn");
                  }}
                >
                  Withdraw request
                </button>
              )
            )}
            {r.status === "accepted" && (
              <p className="hint">
                The owner accepted this introduction. Codovate does not yet
                include team chat or a shared project workspace.
              </p>
            )}
          </article>
        ))}
      </div>
      {!data.items.length && !data.loading && !data.error && (
        <div className="career-empty">
          <Users />
          <h2>No requests here yet.</h2>
          <p>
            {incoming
              ? "Introductions will appear here when students request to join."
              : "Find an open team and send a thoughtful introduction."}
          </p>
        </div>
      )}
      <Pagination data={data} />
    </section>
  );
}
export function Teams({ manage = false }) {
  const { user, profile, admin } = useSession();
  const [params, setParams] = useSearchParams();
  const requested = ["mine", "requests"].includes(params.get("view"))
      ? params.get("view")
      : "",
    scope = manage ? "all" : requested === "mine" ? "mine" : "open";
  const requests = !manage && requested === "requests";
  const data = useCareerPage("teams", user.uid, manage, scope);
  const [search, setSearch] = useState(""),
    [editor, setEditor] = useState(null),
    [joining, setJoining] = useState(null),
    [reviewing, setReviewing] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function act(action, success) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      data.refresh();
      setMessage(success);
    } catch (e) {
      setError(readable(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    await act(async () => {
      await saveCommunity(
        "teams",
        user,
        profile,
        raw,
        editor?.id ? editor : null,
      );
      setEditor(null);
      if (!manage) setParams({ view: "mine" });
    }, "Team saved.");
  }
  async function join(e) {
    e.preventDefault();
    const note = new FormData(e.currentTarget).get("note");
    await act(async () => {
      await requestTeam(user, profile, joining.id, note);
      setJoining(null);
      if (!manage) setParams({ view: "requests" });
    }, "Request sent. Follow its status under My requests.");
  }
  function view(value) {
    setParams(value ? { view: value } : {});
    setEditor(null);
    setJoining(null);
    setReviewing(null);
    setError("");
    setMessage("");
  }
  if (reviewing)
    return (
      <TeamRequests
        key={reviewing.id}
        team={reviewing}
        incoming
        manage={manage || admin}
        onClose={() => setReviewing(null)}
      />
    );
  const items = data.items.filter((t) =>
    (t.title + " " + t.summary + " " + t.lookingFor + " " + t.skills.join(" "))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <section className="community-hero teams-hero">
        <div>
          <span className="eyebrow">GOOD IDEAS NEED GOOD PEOPLE</span>
          <h2>
            Find your people.
            <br />
            <em>Build something together.</em>
          </h2>
          <p>
            Discover student teams, introduce your skills and turn a shared idea
            into a next step.
          </p>
        </div>
        <div className="team-art" aria-hidden="true">
          <span className="team-orbit" />
          <span className="team-person person-one">&lt;/&gt;</span>
          <span className="team-person person-two">✳</span>
          <span className="team-person person-three">
            <Users size={26} />
          </span>
        </div>
      </section>
      <div className="community-toolbar">
        <div className="type-tabs" role="group" aria-label="Team views">
          {!manage &&
            [
              ["", "Discover teams"],
              ["mine", "My teams"],
              ["requests", "My requests"],
            ].map(([v, label]) => (
              <button
                key={v}
                className={(requested || "") === v ? "active" : ""}
                aria-pressed={(requested || "") === v}
                onClick={() => view(v)}
              >
                {label}
              </button>
            ))}
        </div>
        <button
          className="button"
          disabled={busy || !configured}
          onClick={() => {
            setEditor({});
            setJoining(null);
          }}
        >
          <Plus size={16} />
          Start a team
        </button>
      </div>
      <Feedback error={error} message={message} />
      {editor && (
        <CommunityForm
          key={editor.id || "new"}
          kind="teams"
          editing={editor.id ? editor : null}
          onSubmit={save}
          busy={busy}
          onCancel={() => setEditor(null)}
        />
      )}
      {joining && (
        <JoinForm
          team={joining}
          busy={busy}
          onSubmit={join}
          onCancel={() => setJoining(null)}
        />
      )}
      {requests ? (
        <TeamRequests />
      ) : (
        <>
          <label className="directory-search">
            Search loaded teams
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Idea, skill or teammate role"
            />
          </label>
          <div className="team-grid">
            {items.map((t) => (
              <article className="panel team-card" key={t.id}>
                <div className="team-card-top">
                  <span className="team-icon">
                    <Users size={23} />
                  </span>
                  <span className={"request-state state-" + t.status}>
                    {t.status === "open" ? "Recruiting" : t.status}
                  </span>
                </div>
                <span className="eyebrow">{t.category}</span>
                <h2>{t.title}</h2>
                <p className="community-summary">{t.summary}</p>
                <div className="skill-row">
                  {t.skills.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="looking-for">
                  <span>LOOKING FOR</span>
                  <p>{t.lookingFor}</p>
                </div>
                <div className="team-owner">Started by {t.studentName}</div>
                {t.studentId === user.uid || manage ? (
                  <div className="card-actions">
                    <button
                      disabled={busy || t.status === "hidden"}
                      onClick={() => {
                        setEditor(t);
                        setJoining(null);
                      }}
                    >
                      Edit team
                    </button>
                    <button disabled={busy} onClick={() => setReviewing(t)}>
                      Review requests
                    </button>
                    {manage && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            () =>
                              moderateCommunity(
                                "teams",
                                t.id,
                                t.status === "hidden" ? "closed" : "hidden",
                              ),
                            "Team moderation updated.",
                          )
                        }
                      >
                        {t.status === "hidden"
                          ? "Restore as closed"
                          : "Hide team"}
                      </button>
                    )}
                  </div>
                ) : (
                  t.status === "open" && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        setJoining(t);
                        setEditor(null);
                      }}
                    >
                      Request to join
                      <ArrowUpRight size={15} />
                    </button>
                  )
                )}
              </article>
            ))}
          </div>
          {!items.length && !data.loading && !data.error && (
            <div className="career-empty">
              <Users />
              <h2>
                {scope === "mine"
                  ? "Your next team starts with you."
                  : "Find a shared spark."}
              </h2>
              <p>
                {scope === "mine"
                  ? "Start a team above and tell students what you want to build."
                  : "No matching teams in the loaded results. Try another skill or load more."}
              </p>
            </div>
          )}
          <Pagination data={data} />
        </>
      )}
    </>
  );
}

export function ProjectDetails() {
  const { id } = useParams(),
    { user, admin, loading: sessionLoading } = useSession();
  const key = [id, user?.uid || "", !!admin].join(":");
  const [state, setState] = useState({
    key: "",
    item: null,
    loading: true,
    error: "",
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setMessage("");
    setState({ key, item: null, loading: configured, error: "" });
    if (!db || sessionLoading) return;
    if (!id || id.includes("/") || id.length > 128) {
      setState({
        key,
        item: null,
        loading: false,
        error: "This project link is invalid.",
      });
      return;
    }
    withTimeout(getDoc(doc(db, "projects", id)), "app/data-timeout")
      .then((snapshot) => {
        if (active)
          setState({
            key,
            item: snapshot.exists()
              ? { ...snapshot.data(), id: snapshot.id }
              : null,
            loading: false,
            error: "",
          });
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            item: null,
            loading: false,
            error:
              error.code === "permission-denied"
                ? "This project is private, hidden or unavailable."
                : readable(error),
          });
      });
    return () => {
      active = false;
    };
  }, [key, id, sessionLoading]);
  const current =
    state.key === key ? state : { item: null, loading: true, error: "" };
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Project link copied.");
    } catch {
      setMessage("Copy the project URL from your address bar to share it.");
    }
  }
  const p = current.item;
  return (
    <div className="container section">
      <Link className="text-link" to="/projects">
        ← Student showcase
      </Link>
      {!configured ? (
        <div className="career-empty">
          <Code2 />
          <h1>Connect Firebase to view student projects.</h1>
          <Link className="button secondary" to="/setup">
            View setup steps
          </Link>
        </div>
      ) : current.loading || sessionLoading ? (
        <p role="status">Loading project…</p>
      ) : !p ? (
        <div className="career-empty">
          <LockKeyhole />
          <h1>Project unavailable</h1>
          <p>
            {current.error ||
              "The project may have been deleted or is not available to view."}
          </p>
          <Link className="button secondary" to="/projects">
            Browse student work
          </Link>
        </div>
      ) : (
        <div className="detail-layout project-detail">
          <article className="panel detail-main">
            <span className="pill">{p.category}</span>
            <h1>{p.title}</h1>
            <p className="organization">A project by {p.studentName}</p>
            <h2>The story behind the project</h2>
            <p className="multiline">{p.summary}</p>
            <h2>Skills in practice</h2>
            <div className="skill-row">
              {p.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="project-links">
              <SafeLink url={p.repoUrl}>Explore repository</SafeLink>
              <SafeLink url={p.demoUrl}>Try live demo</SafeLink>
            </div>
          </article>
          <aside className="panel apply-panel">
            <span className="eyebrow">STUDENT SPOTLIGHT</span>
            <h2>
              Real work.
              <br />A growing portfolio.
            </h2>
            <p>
              {p.visibility === "public" && p.moderation === "visible"
                ? "This project is publicly shared by its creator."
                : "This project is restricted to its owner and administrators."}
            </p>
            {p.visibility === "public" && p.moderation === "visible" && (
              <button className="button full" onClick={copy}>
                Copy project link <ArrowUpRight size={16} />
              </button>
            )}
            {message && <p role="status">{message}</p>}
            <Link
              className="button secondary full"
              to={user ? "/projects?view=mine" : "/signup"}
            >
              Build your portfolio
            </Link>
            <p className="hint">
              Project links lead to student-provided external sites. Private
              profile and résumé data are not part of this page.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
