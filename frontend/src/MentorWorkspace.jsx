import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Target, FileText, ArrowUpRight } from "lucide-react";
import { db } from "./firebase";
import {
  emptyPreparation,
  emptyPlan,
  saveMentoringWorkspace,
} from "./mentoringWorkspaceData";

export default function MentorWorkspace({ booking, manage = false }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!db) {
      setState({
        loading: false,
        data: null,
        error: "Connect Firebase to open your workspace.",
      });
      return;
    }
    return onSnapshot(
      doc(db, "mentorWorkspaces", booking.id),
      (s) =>
        setState({
          loading: false,
          data: s.exists() ? s.data() : null,
          error: "",
        }),
      () =>
        setState({
          loading: false,
          data: null,
          error:
            "We could not load this private workspace. Please close it and try again.",
        }),
    );
  }, [booking.id]);
  async function save(kind, raw) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await saveMentoringWorkspace(booking.id, kind, raw);
      setMessage("Saved to your private session workspace.");
    } catch (e) {
      setMessage(
        e.code
          ? "Could not save. Check your connection and try again."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (state.loading) return <p role="status">Opening private workspace…</p>;
  if (state.error) return <p role="alert">{state.error}</p>;
  const prep = state.data?.preparation || emptyPreparation;
  const plan = state.data?.plan || emptyPlan;
  const completed = state.data?.completedActions || [];
  const closed = ["cancelled", "declined"].includes(booking.status);

  return (
    <section
      className="mentor-workspace"
      aria-label="Private session workspace"
    >
      <div className="mentor-workspace-heading">
        <Target size={20} />
        <div>
          <h3>Your session workspace</h3>
          <p>Prepare with purpose. Leave with a next step.</p>
        </div>
      </div>
      <p className="hint">
        Visible only to you and authorized Codovate administrators coordinating
        your mentor session.
      </p>
      {closed && (
        <p className="hint">
          This booking is closed. Your notes remain available to read.
        </p>
      )}
      {manage || closed ? (
        <div>
          <h4>Student preparation</h4>
          <p className="multiline">
            {prep.goal || "Preparation not shared yet."}
          </p>
          {prep.context && <p className="multiline">{prep.context}</p>}
          {prep.artifactUrl && (
            <a
              href={prep.artifactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View project or portfolio <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      ) : (
        <form
          key={"prep" + JSON.stringify(prep)}
          onSubmit={(e) => {
            e.preventDefault();
            save(
              "preparation",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
          }}
        >
          <fieldset disabled={busy}>
            <legend>
              <FileText size={16} /> Before we meet
            </legend>
            <label>
              One goal for this session
              <textarea
                name="goal"
                required
                maxLength={300}
                rows={2}
                defaultValue={prep.goal}
                placeholder="For example: review my project architecture before the demo"
              />
            </label>
            <label>
              What have you tried?
              <textarea
                name="context"
                maxLength={1500}
                rows={3}
                defaultValue={prep.context}
                placeholder="Share your progress, blockers and questions."
              />
            </label>
            <label>
              Project, résumé or portfolio link (optional)
              <input
                name="artifactUrl"
                type="url"
                pattern="https://.*"
                maxLength={500}
                defaultValue={prep.artifactUrl}
                placeholder="https://"
              />
            </label>
            <button className="button secondary">Save preparation</button>
          </fieldset>
        </form>
      )}
      {manage &&
        !closed &&
        ["confirmed", "completed"].includes(booking.status) && (
          <form
            key={"plan" + JSON.stringify(plan)}
            onSubmit={(e) => {
              e.preventDefault();
              save("plan", Object.fromEntries(new FormData(e.currentTarget)));
            }}
          >
            <fieldset disabled={busy}>
              <legend>Mentor takeaway & action plan</legend>
              <label>
                Session takeaway
                <textarea
                  name="summary"
                  required
                  maxLength={1500}
                  rows={3}
                  defaultValue={plan.summary}
                />
              </label>
              {[0, 1, 2].map((i) => (
                <label key={i}>
                  Next step {i + 1}
                  {i ? " (optional)" : ""}
                  <input
                    name={"action" + (i + 1)}
                    required={i === 0}
                    maxLength={180}
                    defaultValue={plan.actions[i] || ""}
                  />
                </label>
              ))}
              <p className="hint">
                Updating the plan resets progress so the student can review the
                new steps.
              </p>
              <button className="button">Share action plan</button>
            </fieldset>
          </form>
        )}
      <div className="mentor-action-plan">
        <h4>
          <CheckCircle2 size={17} /> Your next steps
        </h4>
        {plan.actions.length ? (
          <>
            <p className="multiline">{plan.summary}</p>
            <progress
              max={plan.actions.length}
              value={completed.length}
              aria-label="Action plan progress"
            />
            <p className="hint">
              {completed.length} of {plan.actions.length} steps complete
            </p>
            {plan.actions.map((action, i) => (
              <label className="mentor-step" key={action}>
                <input
                  type="checkbox"
                  checked={completed.includes(i)}
                  disabled={busy || manage || closed}
                  onChange={(e) =>
                    save("progress", {
                      index: i,
                      action,
                      checked: e.target.checked,
                    })
                  }
                />
                <span>{action}</span>
              </label>
            ))}
          </>
        ) : (
          <p className="hint">
            Your mentor’s takeaway and next steps will appear here after the
            administrator shares them.
          </p>
        )}
      </div>
      {booking.status === "completed" &&
        (manage ? (
          <div>
            <h4>Student reflection</h4>
            <p>
              {state.data?.rating
                ? `${state.data.rating}/5 · ${state.data.reflection}`
                : "No reflection shared yet."}
            </p>
          </div>
        ) : (
          <form
            key={"feedback" + state.data?.reflection + state.data?.rating}
            onSubmit={(e) => {
              e.preventDefault();
              save(
                "feedback",
                Object.fromEntries(new FormData(e.currentTarget)),
              );
            }}
          >
            <fieldset disabled={busy}>
              <legend>Reflect & move forward</legend>
              <label>
                How useful was the session?
                <select
                  name="rating"
                  required
                  defaultValue={state.data?.rating || ""}
                >
                  <option value="" disabled>
                    Choose a rating
                  </option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </label>
              <label>
                What will you apply next?
                <textarea
                  name="reflection"
                  required
                  maxLength={1000}
                  rows={3}
                  defaultValue={state.data?.reflection || ""}
                />
              </label>
              <button className="button secondary">Save reflection</button>
            </fieldset>
          </form>
        ))}
      {message && (
        <p role="status" className="hint">
          {message}
        </p>
      )}
    </section>
  );
}
