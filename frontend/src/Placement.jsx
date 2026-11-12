import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useSession } from "./session";
import { withTimeout } from "./authSupport";
import { sections, placementInput } from "./placementData";
import "./placement.css";
import { AptitudeLearningSummary } from "./AptitudeLearningSummary";
import { CareerPortals } from "./CareerPortals";
import { AptitudeReader } from "./AptitudeReader";
export function Placement({ manage = false }) {
  const { user, admin } = useSession();
  const [params, setParams] = useSearchParams();
  const section = sections.find((s) => s.id === params.get("section"));
  const folder = params.get("folder") || "",
    article = params.get("article") || "";
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [revision, refresh] = useState(0),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  const allowed = manage && admin;
  const [draftQuestions, setDraftQuestions] = useState([]);
  useEffect(() => setDraftQuestions(editing?.practice || []), [editing]);
  function questionChange(index, key, value) {
    setDraftQuestions((qs) =>
      qs.map((q, i) => (i === index ? { ...q, [key]: value } : q)),
    );
  }
  useEffect(() => {
    let active = true;
    setItems([]);
    setEditing(null);
    setError("");
    if (!user || !section) {
      setLoading(false);
      return;
    }
    if (!db) {
      setError("Connect Firebase to access placement materials.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const filters = [where("sectionId", "==", section.id)];
    if (!allowed) filters.push(where("status", "==", "published"));
    withTimeout(
      getDocs(
        query(collection(db, "placementContent"), ...filters, limit(501)),
      ),
      "placement/load-timeout",
    )
      .then((s) => {
        if (active) {
          if (s.docs.length > 500) {
            setError(
              "This section exceeds the current 500-item view limit. Ask the administrator to organize it into smaller sections before adding more material.",
            );
            return;
          }
          setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load placement content. Check your connection and deployed Firestore rules.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section?.id, allowed, revision, user?.uid]);
  function go(extra = {}) {
    setParams({
      ...(manage ? { tab: "placement" } : {}),
      ...(section ? { section: section.id } : {}),
      ...extra,
    });
    setEditing(null);
    setMessage("");
  }
  const showCareerPortals =
    section?.id === "career-portals" && !folder && !article;
  const current = items.find((i) => i.id === (article || folder));
  const children = items
    .filter((i) => i.parentId === folder)
    .sort((a, b) =>
      a.kind === b.kind
        ? a.title.localeCompare(b.title)
        : a.kind === "folder"
          ? -1
          : 1,
    );
  const ancestors = [];
  let cursor = items.find((i) => i.id === folder);
  const seen = new Set();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    ancestors.unshift(cursor);
    cursor = items.find((i) => i.id === cursor.parentId);
  }
  async function save(e) {
    e.preventDefault();
    if (busy || !allowed || !db) return;
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const input = placementInput({
        ...Object.fromEntries(new FormData(form)),
        sectionId: section.id,
        parentId: editing?.parentId ?? folder,
        practice: draftQuestions,
      });
      const updatedAt = serverTimestamp();
      if (editing)
        await withTimeout(
          updateDoc(doc(db, "placementContent", editing.id), {
            ...input,
            updatedAt,
          }),
          "placement/save-timeout",
        );
      else
        await withTimeout(
          addDoc(collection(db, "placementContent"), {
            ...input,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt,
          }),
          "placement/save-timeout",
        );
      setEditing(null);
      form.reset();
      refresh((v) => v + 1);
      setMessage(
        "Saved. Published lessons are visible to students; drafts stay in administration.",
      );
    } catch (e) {
      setError(
        e.code
          ? "Could not save. Check your connection, administrator access and Firestore rules."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (manage && !admin)
    return <p role="alert">Administrator access required.</p>;
  return (
    <section className="placement-module" aria-label="Placement Preparation">
      {(manage || admin) && (
        <div className="placement-heading">
          {manage && (
            <div>
              <span className="eyebrow">BUILD YOUR NEXT STEP</span>
              <h2>Content library</h2>
              <p>Explore topics, open a folder and learn at your own pace.</p>
            </div>
          )}
          {!manage && admin && (
            <Link className="button secondary" to="/admin?tab=placement">
              Manage content
            </Link>
          )}
        </div>
      )}
      {manage && (
        <p className="notice">
          Create folders and readable articles here. Add material one topic at a
          time, save drafts, then publish when reviewed. Student rewards are not
          enabled in this stage.
        </p>
      )}
      <nav className="placement-breadcrumb" aria-label="Preparation breadcrumb">
        <button
          onClick={() => {
            setParams(manage ? { tab: "placement" } : {});
            setEditing(null);
          }}
        >
          All 24 sections
        </button>
        {section && (
          <>
            <span>/</span>
            <button onClick={() => go()}>{section.title}</button>
          </>
        )}
        {ancestors.map((a) => (
          <span key={a.id}>
            {" "}
            / <button onClick={() => go({ folder: a.id })}>{a.title}</button>
          </span>
        ))}
      </nav>
      {section?.id === "aptitude" && !manage && !article && (
        <AptitudeLearningSummary
          items={items}
          view={folder + article + revision}
        />
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
          <button
            className="button secondary small"
            onClick={() => refresh((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {!section ? (
        <>
          <label className="placement-search">
            Find a preparation section
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search aptitude, DSA, interviews…"
            />
          </label>
          {[...new Set(sections.map((s) => s.group))].map((group) => {
            const list = sections.filter(
              (s) =>
                s.group === group &&
                s.title.toLowerCase().includes(search.toLowerCase()),
            );
            return list.length ? (
              <section key={group}>
                <h3>{group}</h3>
                <div className="placement-grid">
                  {list.map((s) => (
                    <button
                      className="panel placement-section"
                      key={s.id}
                      onClick={() => {
                        setParams({
                          ...(manage ? { tab: "placement" } : {}),
                          section: s.id,
                        });
                        setSearch("");
                      }}
                    >
                      <span className="pill">
                        {s.id === "aptitude"
                          ? "Start here"
                          : "Learning section"}
                      </span>
                      <h3>{s.title}</h3>
                      <span>Browse topics →</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null;
          })}
          {!sections.some((s) =>
            s.title.toLowerCase().includes(search.toLowerCase()),
          ) && <p>No sections match this search.</p>}
        </>
      ) : (
        <>
          {showCareerPortals && <CareerPortals />}
          {loading ? (
            <p role="status">Loading topics…</p>
          ) : article ? (
            <>
              {current?.kind === "article" ? (
                <article className="panel placement-article">
                  <span className="pill">{current.status}</span>
                  <h2>{current.title}</h2>
                  <p>{current.summary}</p>
                  <AptitudeReader
                    key={(user?.uid || "guest") + current.id}
                    lesson={current}
                  />
                  {current.sourceUrl && (
                    <p>
                      <a
                        href={current.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source material ↗
                      </a>
                    </p>
                  )}
                  <button
                    className="button secondary"
                    onClick={() =>
                      go(current.parentId ? { folder: current.parentId } : {})
                    }
                  >
                    Back to topics
                  </button>
                  {allowed && (
                    <button
                      className="button secondary"
                      onClick={() => setEditing(current)}
                    >
                      Edit article
                    </button>
                  )}
                </article>
              ) : (
                <p>This article is unavailable or has not been published.</p>
              )}
            </>
          ) : (
            <>
              {!showCareerPortals && <h3>{current?.title || section.title}</h3>}
              {folder && !current ? (
                <p>This folder is unavailable or has not been published.</p>
              ) : (
                <>
                  {!showCareerPortals && !children.length && !error && (
                    <div className="panel">
                      <h3>Material is being prepared</h3>
                      <p>
                        This section is ready for folders and lessons. Published
                        material will appear here.
                      </p>
                    </div>
                  )}
                  <div className="placement-grid">
                    {children.map((item) => (
                      <div className="panel" key={item.id}>
                        <span className="pill">
                          {item.kind === "folder" ? "Folder" : "Article"}
                          {allowed ? " · " + item.status : ""}
                        </span>
                        <h3>{item.title}</h3>
                        {item.minutes && (
                          <span className="pill">
                            {item.minutes} min · {item.level || "Lesson"}
                          </span>
                        )}
                        <p>{item.summary}</p>
                        <button
                          className="button secondary"
                          onClick={() =>
                            go(
                              item.kind === "folder"
                                ? { folder: item.id }
                                : {
                                    article: item.id,
                                    ...(folder ? { folder } : {}),
                                  },
                            )
                          }
                        >
                          Open {item.kind} →
                        </button>
                        {allowed && (
                          <button
                            className="button secondary small"
                            onClick={() => setEditing(item)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {allowed && db && (
            <form
              key={editing?.id || folder + "new"}
              className="panel profile-form placement-editor"
              onSubmit={save}
            >
              <h3>{editing ? "Edit content" : "Add to this folder"}</h3>
              <div className="form-grid">
                <label>
                  Type
                  <select
                    name="kind"
                    defaultValue={editing?.kind || "folder"}
                    disabled={!!editing}
                  >
                    <option value="folder">Folder</option>
                    <option value="article">Readable article</option>
                  </select>
                  {editing && (
                    <input type="hidden" name="kind" value={editing.kind} />
                  )}
                </label>
                <label>
                  Visibility
                  <select
                    name="status"
                    defaultValue={editing?.status || "draft"}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label>
                  Title
                  <input
                    name="title"
                    required
                    maxLength={140}
                    defaultValue={editing?.title || ""}
                  />
                </label>
                <label>
                  Summary
                  <textarea
                    name="summary"
                    maxLength={600}
                    defaultValue={editing?.summary || ""}
                  />
                </label>
              </div>
              <label>
                Lesson text (articles only)
                <textarea
                  name="body"
                  rows={14}
                  maxLength={40000}
                  defaultValue={editing?.body || ""}
                  placeholder="Write clear explanations, examples and practice guidance. Text is displayed safely as written."
                />
              </label>
              <label>
                Source link (optional, articles only)
                <input
                  name="sourceUrl"
                  type="url"
                  maxLength={500}
                  defaultValue={editing?.sourceUrl || ""}
                  placeholder="https://…"
                />
              </label>
              <div className="form-grid">
                <label>
                  Reading time (minutes)
                  <input
                    type="number"
                    name="minutes"
                    min={1}
                    max={60}
                    defaultValue={editing?.minutes || 7}
                  />
                </label>
                <label>
                  Level
                  <select
                    name="level"
                    defaultValue={editing?.level || "Foundation"}
                  >
                    <option>Foundation</option>
                    <option>Intermediate</option>
                    <option>Reference</option>
                  </select>
                </label>
              </div>
              <label>
                Source and editorial note
                <textarea
                  name="sourceNote"
                  maxLength={600}
                  rows={3}
                  defaultValue={editing?.sourceNote || ""}
                />
              </label>
              <h4>Practice checkpoints (articles only)</h4>
              {draftQuestions.map((q, i) => (
                <fieldset key={i} className="apt-editor-question">
                  <legend>Question {i + 1}</legend>
                  <label>
                    Question
                    <input
                      required
                      maxLength={1500}
                      value={q.prompt}
                      onChange={(e) =>
                        questionChange(i, "prompt", e.target.value)
                      }
                    />
                  </label>
                  {q.options.map((o, n) => (
                    <label key={n}>
                      Option {n + 1}
                      <input
                        required
                        maxLength={300}
                        value={o}
                        onChange={(e) =>
                          questionChange(
                            i,
                            "options",
                            q.options.map((v, j) =>
                              j === n ? e.target.value : v,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Correct option
                    <select
                      value={q.answerIndex}
                      onChange={(e) =>
                        questionChange(i, "answerIndex", Number(e.target.value))
                      }
                    >
                      {q.options.map((_, n) => (
                        <option key={n} value={n}>
                          Option {n + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Explanation
                    <textarea
                      required
                      maxLength={2000}
                      value={q.explanation}
                      onChange={(e) =>
                        questionChange(i, "explanation", e.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() =>
                      setDraftQuestions((qs) => qs.filter((_, n) => n !== i))
                    }
                  >
                    Remove question {i + 1}
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className="button secondary"
                disabled={draftQuestions.length >= 6}
                onClick={() =>
                  setDraftQuestions((qs) => [
                    ...qs,
                    {
                      prompt: "",
                      options: ["", "", "", ""],
                      answerIndex: 0,
                      explanation: "",
                    },
                  ])
                }
              >
                Add practice question
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save content"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel edit
                </button>
              )}
            </form>
          )}
          {!db && (
            <p className="notice">
              The section structure is available. Connect Firebase to load and
              manage lesson content.
            </p>
          )}
        </>
      )}
    </section>
  );
}
