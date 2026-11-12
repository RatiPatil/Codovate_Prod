import { useRef, useState } from "react";
import { collection, doc } from "firebase/firestore";
import {
  ListTodo,
  Plus,
  CalendarDays,
  Trash2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { db } from "./firebase";
import { useTeamFeed } from "./teamHubData";
import { MemberName, FeedStatus } from "./TeamWidgets";
import {
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  editTeamTask,
  taskStates,
} from "./teamTasksData";
export function TeamTaskBoard({ team, user, act, busy }) {
  const [limit, setLimit] = useState(100),
    [creating, setCreating] = useState(false),
    [editing, setEditing] = useState(null),
    [mineOnly, setMineOnly] = useState(false);
  const taskId = useRef(null);
  const feed = useTeamFeed(
    `projectTeams/${team.id}/tasks`,
    user.uid,
    [],
    limit,
    ["createdAt", "desc"],
  );
  const readOnly = team.lifecycle !== "active",
    ready = !feed.loading && !feed.error && !feed.cached;
  const tasks = mineOnly
    ? feed.items.filter((task) => task.assigneeId === user.uid)
    : feed.items;
  const done = tasks.filter((task) => task.status === "done").length;
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <section className="panel team-task-board" aria-label="Team task board">
      <header className="hub-section-heading">
        <div>
          <span className="eyebrow">FROM IDEAS TO PROGRESS</span>
          <h2>
            <ListTodo size={20} aria-hidden="true" /> Team task board
          </h2>
          <p className="hint">
            One shared place for what you’re building next.
          </p>
        </div>
        <button
          className="button"
          disabled={busy || readOnly || !ready}
          aria-expanded={creating}
          onClick={() => {
            setEditing(null);
            taskId.current = null;
            setCreating((v) => !v);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          {creating ? "Close task form" : "Add task"}
        </button>
      </header>
      <FeedStatus feed={feed} />
      <div className="task-progress-row">
        <span>
          <CheckCircle2 size={16} aria-hidden="true" />
          {feed.loading
            ? "Syncing tasks…"
            : `${done}/${tasks.length} tasks in this view complete`}
        </span>
        <label className="task-filter">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
          />
          Assigned to me
        </label>
      </div>
      <progress
        max={Math.max(tasks.length, 1)}
        value={done}
        aria-label="Task progress in this view"
      />
      {readOnly && (
        <p className="hint">This team is archived. Tasks are read-only.</p>
      )}
      {creating && (
        <form
          key={editing?.id || "new"}
          className="discovery-form team-task-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const raw = Object.fromEntries(new FormData(form));
            taskId.current ||= doc(
              collection(db, "projectTeams", team.id, "tasks"),
            ).id;
            act(
              async () => {
                if (editing)
                  await editTeamTask(team.id, editing.id, user.uid, raw);
                else
                  await createTeamTask(team.id, user.uid, raw, taskId.current);
                taskId.current = null;
                form.reset();
                setCreating(false);
                setEditing(null);
              },
              editing
                ? "Task details saved."
                : "Task added to your team board.",
            );
          }}
        >
          <label>
            Task title
            <input
              name="title"
              defaultValue={editing?.title || ""}
              required
              maxLength={160}
              placeholder="What will you build or finish?"
            />
          </label>
          <label>
            Assign to
            <select
              name="assigneeId"
              defaultValue={
                team.members.includes(editing?.assigneeId)
                  ? editing.assigneeId
                  : ""
              }
              aria-label="Task assignee"
            >
              <option value="">Unassigned</option>
              {team.members.map((uid) => (
                <option key={uid} value={uid}>
                  {uid === user.uid ? (
                    "Me"
                  ) : team.roles[uid] === "leader" ? (
                    "Team leader"
                  ) : (
                    <MemberName
                      uid={uid}
                      fallback={`Member ${team.members.indexOf(uid) + 1}`}
                    />
                  )}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              name="dueDate"
              type="date"
              defaultValue={editing?.dueDate || ""}
            />
          </label>
          <label>
            Task details
            <textarea
              name="description"
              defaultValue={editing?.description || ""}
              rows={2}
              maxLength={800}
              placeholder="Add the context your teammates need"
            />
          </label>
          <button className="button" disabled={busy || readOnly || !ready}>
            {editing ? "Save task" : "Create task"}
          </button>
        </form>
      )}
      <div className="task-columns">
        {Object.entries(taskStates).map(([state, label]) => (
          <section
            className={`task-column ${state}`}
            key={state}
            aria-label={label}
          >
            <header>
              <h3>{label}</h3>
              <span>
                {tasks.filter((task) => task.status === state).length}
              </span>
            </header>
            {tasks
              .filter((task) => task.status === state)
              .map((task) => (
                <article className="team-task" key={task.id}>
                  <h4>{task.title}</h4>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-meta">
                    <span>
                      {task.assigneeId ? (
                        <MemberName
                          uid={task.assigneeId}
                          fallback={
                            team.members.includes(task.assigneeId)
                              ? "Team member"
                              : "Former member"
                          }
                        />
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                    {task.dueDate && (
                      <span
                        className={
                          task.status !== "done" && task.dueDate < dateKey
                            ? "task-overdue"
                            : ""
                        }
                      >
                        <CalendarDays size={13} aria-hidden="true" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                  <div className="task-controls">
                    <label>
                      <span className="sr-only">Status for {task.title}</span>
                      <select
                        aria-label={`Status for ${task.title}`}
                        value={task.status}
                        disabled={busy || readOnly || !ready}
                        onChange={(e) =>
                          act(
                            () =>
                              updateTeamTask(team.id, task.id, user.uid, {
                                status: e.target.value,
                              }),
                            "Task status updated.",
                          )
                        }
                      >
                        {Object.entries(taskStates).map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(task.createdBy === user.uid ||
                      team.ownerId === user.uid) && (
                      <>
                        <button
                          className="task-delete"
                          aria-label={`Edit ${task.title}`}
                          disabled={busy || readOnly || !ready}
                          onClick={() => {
                            setEditing(task);
                            setCreating(true);
                          }}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          className="task-delete"
                          aria-label={`Delete ${task.title}`}
                          disabled={busy || readOnly || !ready}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this task? This cannot be undone.",
                              )
                            )
                              act(
                                () =>
                                  deleteTeamTask(team.id, task.id, user.uid),
                                "Task deleted.",
                              );
                          }}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            {ready && !tasks.some((task) => task.status === state) && (
              <p className="task-empty">
                {state === "todo"
                  ? "Your next steps go here."
                  : state === "doing"
                    ? "Work in progress appears here."
                    : "Celebrate completed work here."}
              </p>
            )}
          </section>
        ))}
      </div>
      {feed.items.length === limit && limit < 500 && (
        <button className="text-link" onClick={() => setLimit((n) => n + 100)}>
          Load more tasks
        </button>
      )}
    </section>
  );
}
