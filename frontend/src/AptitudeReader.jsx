import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useSession } from "./session";
import { db } from "./firebase";
import { withTimeout } from "./authSupport";
export function LessonText({ body, reference = false }) {
  if (reference) return <pre className="apt-reference">{body}</pre>;
  return (
    <div className="apt-lesson-text">
      {body.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n");
        if (lines[0].startsWith("## "))
          return (
            <section key={i}>
              <h3>{lines[0].slice(3)}</h3>
              {lines.slice(1).length > 0 && <p>{lines.slice(1).join("\n")}</p>}
            </section>
          );
        if (lines.length > 1 && lines.every((x) => x.startsWith("|"))) {
          const rows = lines
            .filter((x) => !/^\|[\s|:-]+\|$/.test(x))
            .map((x) =>
              x
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim()),
            );
          return (
            <div className="apt-table-scroll" key={i}>
              <table>
                <thead>
                  <tr>
                    {rows[0].map((c, j) => (
                      <th key={j}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, k) => (
                    <tr key={k}>
                      {row.map((c, j) => (
                        <td key={j}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}
const empty = {
  completed: false,
  bookmarked: false,
  note: "",
  practiceScore: 0,
  practiceTotal: 0,
};
export function AptitudeReader({ lesson }) {
  const { user } = useSession();
  const [progress, setProgress] = useState(empty),
    [loading, setLoading] = useState(!!(user && db)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [answers, setAnswers] = useState({}),
    [checked, setChecked] = useState(false);
  const questions = lesson.practice || [];
  const identity = useRef();
  identity.current = (user?.uid || "guest") + ":" + lesson.id;
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setLoadFailed(false);
    setProgress(empty);
    setAnswers({});
    setChecked(false);
    setError("");
    setMessage("");
    if (!user || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    withTimeout(
      getDoc(doc(db, "placementProgress", user.uid + "_" + lesson.id)),
      "placement/progress-timeout",
    )
      .then((s) => {
        if (active && s.exists()) setProgress(s.data());
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setError(
            "Your saved progress could not be loaded. Retry by reopening the lesson; changes are disabled to protect saved notes.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid, lesson.id]);

  async function save(patch) {
    if (!user || !db || busy || loading || loadFailed) return;
    setBusy(true);
    setError("");
    setMessage("");
    const next = { ...progress, ...patch };
    const requestIdentity = identity.current;
    try {
      await withTimeout(
        setDoc(doc(db, "placementProgress", user.uid + "_" + lesson.id), {
          studentId: user.uid,
          lessonId: lesson.id,
          completed: next.completed,
          bookmarked: next.bookmarked,
          note: next.note,
          practiceScore: next.practiceScore,
          practiceTotal: next.practiceTotal,
          updatedAt: serverTimestamp(),
        }),
        "placement/progress-timeout",
      );
      if (identity.current !== requestIdentity) return;
      setProgress(next);
      setMessage("Saved to your private learning record.");
    } catch {
      if (identity.current !== requestIdentity) return;
      setError(
        "Could not save your learning record. Your current answers and notes remain on this screen; try again.",
      );
    } finally {
      if (identity.current === requestIdentity) setBusy(false);
    }
  }
  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  return (
    <>
      <div className="apt-meta">
        <span className="pill">{lesson.level || "Lesson"}</span>
        {lesson.minutes && <span>{lesson.minutes} min read</span>}
        {progress.completed && <span className="pill">Completed</span>}
      </div>
      {lesson.level === "Reference" && (
        <p className="notice">
          Source review copy. OCR, formulas, diagrams and answer keys require
          editorial verification before student publication.
        </p>
      )}
      <LessonText body={lesson.body} reference={lesson.level === "Reference"} />
      {questions.length > 0 && (
        <section className="apt-checkpoint" aria-label="Practice checkpoint">
          <h3>Check your understanding</h3>
          <p>
            Choose an answer, then review the explanation to strengthen your method.
          </p>
          {questions.map((q, i) => (
            <fieldset key={i}>
              <legend>
                {i + 1}. {q.prompt}
              </legend>
              {q.options.map((o, n) => (
                <label className="apt-option" key={n}>
                  <input
                    type="radio"
                    name={lesson.id + "-" + i}
                    checked={answers[i] === n}
                    onChange={() => {
                      setAnswers({ ...answers, [i]: n });
                      setChecked(false);
                    }}
                  />
                  {o}
                </label>
              ))}
              {checked && (
                <div className="apt-feedback" role="status">
                  <strong>
                    {answers[i] === q.answerIndex
                      ? "Correct"
                      : "Review this one"}
                  </strong>
                  <p>Answer: {q.options[q.answerIndex]}</p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </fieldset>
          ))}
          <button
            className="button"
            disabled={Object.keys(answers).length !== questions.length}
            onClick={() => setChecked(true)}
          >
            Check answers
          </button>
          {checked && (
            <>
              <p role="status">
                Practice result: {score} / {questions.length}
              </p>
              {user && db && (
                <button
                  className="button secondary"
                  disabled={busy || loading || loadFailed}
                  onClick={() =>
                    save({
                      practiceScore: score,
                      practiceTotal: questions.length,
                    })
                  }
                >
                  Save practice result
                </button>
              )}
            </>
          )}
        </section>
      )}
      {lesson.sourceNote && (
        <details className="apt-source">
          <summary>About this lesson and its sources</summary>
          <p>{lesson.sourceNote}</p>
        </details>
      )}
      <section className="apt-private" aria-label="Private learning record">
        <h3>Your learning record</h3>
        {!user ? (
          <p>
            <Link to="/login">Sign in</Link> to save completion, bookmarks and
            notes privately.
          </p>
        ) : !db ? (
          <p>Connect Firebase to save your learning record.</p>
        ) : (
          <>
            {loading ? (
              <p role="status">Loading your learning record…</p>
            ) : (
              <>
                <div className="apt-actions">
                  <button
                    className="button secondary"
                    disabled={busy || loadFailed}
                    onClick={() => save({ completed: !progress.completed })}
                  >
                    {progress.completed
                      ? "Mark as still learning"
                      : "Mark lesson complete"}
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy || loadFailed}
                    onClick={() => save({ bookmarked: !progress.bookmarked })}
                  >
                    {progress.bookmarked
                      ? "Remove bookmark"
                      : "Bookmark lesson"}
                  </button>
                </div>
                <label>
                  Private notes
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={progress.note}
                    disabled={loadFailed}
                    onChange={(e) =>
                      setProgress({ ...progress, note: e.target.value })
                    }
                    placeholder="Write the shortcut or mistake you want to remember."
                  />
                </label>
                <button
                  className="button secondary"
                  disabled={busy || loadFailed}
                  onClick={() => save({ note: progress.note })}
                >
                  {busy ? "Saving…" : "Save notes"}
                </button>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}
          </>
        )}
      </section>
    </>
  );
}
