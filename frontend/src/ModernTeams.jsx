import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useTeamFeed } from "./teamHubData";
import {
  createProjectTeam,
  reviseProjectTeam,
  changeProjectTeam,
  requestProjectJoin,
  inviteProjectMember,
  reviewProjectEntry,
  teamStatus,
} from "./projectTeamsData";
import { MemberName, FeedStatus } from "./TeamWidgets";
function TeamForm({ team, onSave, busy }) {
  return (
    <form
      className="discovery-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        onSave(Object.fromEntries(new FormData(form)), form);
      }}
    >
      <p className="hint">
        The team name, description, required skills and recruitment details are
        visible to signed-in students. Member identities, roles and history stay
        private to team members.
      </p>
      <label>
        Team name
        <input
          name="title"
          required
          maxLength={100}
          defaultValue={team?.title || ""}
        />
      </label>
      <label>
        Team description
        <textarea
          name="description"
          required
          maxLength={2000}
          rows={3}
          defaultValue={team?.description || ""}
        />
      </label>
      <label>
        Required skills (comma separated)
        <input
          name="requiredSkills"
          defaultValue={team?.requiredSkills?.join(", ") || ""}
        />
      </label>
      <label>
        Team capacity
        <select
          aria-label="Team capacity"
          name="capacity"
          defaultValue={team?.capacity || 6}
        >
          {Array.from({ length: 11 }, (_, i) => i + 2).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Recruitment status
        <select
          name="recruitment"
          aria-label="Recruitment status"
          defaultValue={team?.recruitment || "recruiting"}
        >
          <option value="open">Open</option>
          <option value="recruiting">Recruiting</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <button className="button" disabled={busy || !db}>
        {team ? "Save team details" : "Create team"}
      </button>
    </form>
  );
}
export function ModernTeams({
  user,
  act,
  busy,
  onLegacy,
  legacyGroups,
  myPublic,
}) {
  const [joiningTeams, setJoiningTeams] = useState(false);
  const teams = useTeamFeed("projectTeams", user.uid, [
      ["members", "array-contains", user.uid],
    ]),
    invitations = useTeamFeed("projectTeamInvites", user.uid, [
      ["studentId", "==", user.uid],
    ]),
    requests = useTeamFeed("projectTeamRequests", user.uid, [
      ["studentId", "==", user.uid],
    ]);
  const earlierTeams = useTeamFeed("teams", user.uid, [
    ["studentId", "==", user.uid],
  ]);
  const earlierRequests = useTeamFeed("teamRequests", user.uid, [
    ["studentId", "==", user.uid],
  ]);
  const [selected, setSelected] = useState("");
  if (selected)
    return (
      <ProjectWorkspace
        id={selected}
        user={user}
        act={act}
        busy={busy}
        onClose={() => setSelected("")}
      />
    );
  return (
    <>
      <div className="hub-section-heading">
        <div>
          <h2>My Teams</h2>
          <p className="hint">Your teams, invitations and shared goals.</p>
        </div>
        <button
          className="button secondary"
          aria-expanded={joiningTeams}
          onClick={() => setJoiningTeams((v) => !v)}
        >
          {joiningTeams ? "Close team directory" : "Join team"}
        </button>
      </div>
      {joiningTeams && (
        <section className="panel">
          <h3>Find a team to join</h3>
          <ProjectTeamBoard
            user={user}
            act={act}
            busy={busy}
            myPublic={myPublic}
          />
        </section>
      )}
      <details className="panel team-create">
        <summary>Create team</summary>
        <p>
          Bring your idea and invite the skills you need. You can manage members
          and roles from your team workspace.
        </p>
        <TeamForm
          busy={busy}
          onSave={(raw, form) =>
            act(async () => {
              const id = await createProjectTeam(user.uid, raw);
              form.reset();
              setSelected(id);
            }, "Your team workspace is ready.")
          }
        />
      </details>
      <FeedStatus feed={teams} />
      <FeedStatus feed={invitations} />
      {invitations.items
        .filter((i) => i.status === "pending")
        .map((i) => (
          <section className="panel hub-connection" key={i.id}>
            <div>
              <h3>
                <ProjectTitle id={i.teamId} />
              </h3>
              <p>
                Invitation from <MemberName uid={i.ownerId} />
              </p>
            </div>
            <div className="hub-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  act(
                    () =>
                      reviewProjectEntry(
                        "projectTeamInvites",
                        i,
                        user.uid,
                        "accepted",
                      ),
                    "You joined the team.",
                  )
                }
              >
                Join team
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  act(
                    () =>
                      reviewProjectEntry(
                        "projectTeamInvites",
                        i,
                        user.uid,
                        "declined",
                      ),
                    "Invitation declined.",
                  )
                }
              >
                Decline
              </button>
            </div>
          </section>
        ))}
      {!teams.loading &&
        !teams.error &&
        !teams.cached &&
        !teams.items.length &&
        !legacyGroups?.items.length &&
        !earlierTeams.items.length &&
        !legacyGroups?.loading &&
        !earlierTeams.loading &&
        !legacyGroups?.error &&
        !earlierTeams.error && (
          <section className="panel">
            <h3>You haven't joined any teams yet.</h3>
            <p>
              Create a team or discover opportunities through Find Teammates.
            </p>
          </section>
        )}
      <div className="hub-people">
        {teams.items.map((t) => (
          <article className="panel team-project-card" key={t.id}>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <div className="skill-row">
              {t.requiredSkills.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <p>
              {teamStatus(t)} · {t.members.length}/{t.capacity} members ·{" "}
              {t.roles[user.uid]}
            </p>
            <button
              className="button secondary"
              onClick={() => setSelected(t.id)}
            >
              Open team
            </button>
          </article>
        ))}
      </div>
      {!!legacyGroups?.items.length && (
        <section>
          <h3>Earlier private workspaces</h3>
          <div className="hub-people">
            {legacyGroups.items.map((g) => (
              <article className="panel" key={g.id}>
                <h4>{g.title}</h4>
                <p>
                  {g.members.length}/12 members ·{" "}
                  {g.ownerId === user.uid ? "Leader" : "Member"} · {g.status}
                </p>
                <button
                  className="button secondary"
                  onClick={() => onLegacy("groups", g.id)}
                >
                  Open earlier workspace
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      {!!earlierTeams.items.length && (
        <section>
          <h3>Earlier recruiting teams</h3>
          <div className="hub-people">
            {earlierTeams.items.map((t) => (
              <article className="panel team-project-card" key={t.id}>
                <h4>{t.title}</h4>
                <p>{t.summary}</p>
                <button
                  className="button secondary"
                  onClick={() => onLegacy("recruiting", null, "mine")}
                >
                  Manage earlier team
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      {!!earlierRequests.items.filter((r) => r.status === "accepted")
        .length && (
        <details className="panel">
          <summary>Earlier accepted introductions</summary>
          <p>
            These are retained recruiting introductions. They did not
            automatically grant private workspace membership.
          </p>
          {earlierRequests.items
            .filter((r) => r.status === "accepted")
            .map((r) => (
              <p key={r.id}>
                {r.teamTitle} · accepted{" "}
                <button
                  className="text-link"
                  onClick={() => onLegacy("recruiting", null, "requests")}
                >
                  View request
                </button>
              </p>
            ))}
        </details>
      )}
      <details className="panel">
        <summary>My join requests</summary>
        <FeedStatus feed={requests} />
        {requests.items.map((r) => (
          <p key={r.id}>
            Team request · {r.status}{" "}
            {r.status === "pending" && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  act(
                    () =>
                      reviewProjectEntry(
                        "projectTeamRequests",
                        r,
                        user.uid,
                        "withdrawn",
                      ),
                    "Request withdrawn.",
                  )
                }
              >
                Withdraw
              </button>
            )}
          </p>
        ))}
      </details>
      <div className="hub-actions">
        <button className="text-link" onClick={() => onLegacy("groups")}>
          Earlier private workspaces
        </button>
        <button className="text-link" onClick={() => onLegacy("recruiting")}>
          Earlier recruiting teams and requests
        </button>
      </div>
    </>
  );
}
function ProjectWorkspace({ id, user, act, busy, onClose }) {
  const [team, setTeam] = useState(null),
    [error, setError] = useState(""),
    [historySize, setHistorySize] = useState(20),
    [historyOpen, setHistoryOpen] = useState(false),
    [profileLimit, setProfileLimit] = useState(48);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      doc(db, "projectTeams", id),
      (s) => {
        setTeam(s.exists() ? { id: s.id, ...s.data() } : null);
        setError(s.exists() ? "" : "Team unavailable.");
      },
      () => {
        setTeam(null);
        setError("This team is unavailable or your membership has changed.");
      },
    );
  }, [id, user.uid]);
  const incoming = useTeamFeed(
      team?.ownerId === user.uid ? "projectTeamRequests" : null,
      user.uid,
      [
        ["teamId", "==", id],
        ["ownerId", "==", user.uid],
      ],
    ),
    outgoing = useTeamFeed(
      team?.ownerId === user.uid ? "projectTeamInvites" : null,
      user.uid,
      [
        ["teamId", "==", id],
        ["ownerId", "==", user.uid],
      ],
    ),
    history = useTeamFeed(
      team && historyOpen ? "projectTeams/" + id + "/history" : null,
      user.uid,
      [],
      historySize,
      ["createdAt", "desc"],
    ),
    people = useTeamFeed(
      team?.ownerId === user.uid ? "memberProfiles" : null,
      user.uid,
      [],
      profileLimit,
    );
  if (!team)
    return (
      <section className="panel">
        <p role={error ? "alert" : "status"}>{error || "Loading team…"}</p>
        <button className="button secondary" onClick={onClose}>
          Back to My Teams
        </button>
      </section>
    );
  const owner = team.ownerId === user.uid;
  return (
    <>
      <section className="panel">
        <button className="text-link" onClick={onClose}>
          ← My Teams
        </button>
        <h2>{team.title}</h2>
        <p>{team.description}</p>
        <p>
          {teamStatus(team)} · {team.members.length}/{team.capacity} members
        </p>
        <div className="skill-row">
          {team.requiredSkills.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
        <h3>Team members</h3>
        <ul>
          {team.members.map((uid) => (
            <li key={uid}>
              <MemberName uid={uid} /> · {team.roles[uid]}
              {owner && uid !== user.uid && (
                <span className="hub-actions">
                  <label>
                    Team role
                    <select
                      aria-label="Team role"
                      value={team.roles[uid]}
                      disabled={busy}
                      onChange={(e) =>
                        act(
                          () =>
                            changeProjectTeam(
                              id,
                              user.uid,
                              "role",
                              uid,
                              e.target.value,
                            ),
                          "Role updated and recorded in history.",
                        )
                      }
                    >
                      <option value="member">Member</option>
                      <option value="mentor">Mentor</option>
                    </select>
                  </label>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this member and revoke chat access?",
                        )
                      )
                        act(
                          () => changeProjectTeam(id, user.uid, "remove", uid),
                          "Member removed.",
                        );
                    }}
                  >
                    Remove
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="hint">
          Mentor is a team role assigned by the leader, not a verified
          professional credential or platform administrator permission.
        </p>
        {!owner && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Leave this team? You will lose access to its chat and private history.",
                )
              )
                act(async () => {
                  await changeProjectTeam(id, user.uid, "leave");
                  onClose();
                }, "You left the team.");
            }}
          >
            Leave team
          </button>
        )}
      </section>
      {owner && (
        <details className="panel">
          <summary>Manage team</summary>
          <TeamForm
            key={team.version}
            team={team}
            busy={busy}
            onSave={(raw) =>
              act(
                () => reviseProjectTeam(id, user.uid, raw),
                "Team details saved.",
              )
            }
          />
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  team.lifecycle === "active"
                    ? "Archive this team and keep its history read-only?"
                    : "Reopen this team for collaboration?",
                )
              )
                act(
                  () =>
                    changeProjectTeam(
                      id,
                      user.uid,
                      team.lifecycle === "active" ? "archive" : "reopen",
                    ),
                  "Team status updated.",
                );
            }}
          >
            {team.lifecycle === "active" ? "Archive team" : "Reopen team"}
          </button>
        </details>
      )}
      {owner && team.lifecycle === "active" && (
        <section className="panel">
          <h3>Invite members</h3>
          <form
            className="hub-create"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              act(async () => {
                await inviteProjectMember(
                  team,
                  new FormData(form).get("studentId"),
                );
                form.reset();
              }, "Invitation sent.");
            }}
          >
            <label>
              Discoverable student
              <select
                name="studentId"
                aria-label="Discoverable student"
                required
              >
                <option value="">Choose a student</option>
                {people.items
                  .filter((p) => !team.members.includes(p.uid))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="button secondary"
              disabled={busy || team.members.length >= team.capacity}
            >
              Invite
            </button>
          </form>
          {people.items.length === profileLimit && profileLimit < 1968 && (
            <button
              className="text-link"
              onClick={() => setProfileLimit((n) => n + 48)}
            >
              Load more students
            </button>
          )}
          <FeedStatus feed={people} />
          <FeedStatus feed={outgoing} />
          {outgoing.items
            .filter((i) => i.status === "pending")
            .map((i) => (
              <p key={i.id}>
                <MemberName uid={i.studentId} /> · pending{" "}
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () =>
                        reviewProjectEntry(
                          "projectTeamInvites",
                          i,
                          user.uid,
                          "revoked",
                        ),
                      "Invitation cancelled.",
                    )
                  }
                >
                  Cancel invitation
                </button>
              </p>
            ))}
        </section>
      )}
      {owner && (
        <section className="panel">
          <h3>Join requests</h3>
          <FeedStatus feed={incoming} />
          {incoming.items
            .filter((i) => i.status === "pending")
            .map((i) => (
              <article key={i.id}>
                <h4>
                  <MemberName uid={i.studentId} />
                </h4>
                <p>{i.note}</p>
                <div className="hub-actions">
                  <button
                    className="button secondary"
                    disabled={
                      busy ||
                      team.lifecycle !== "active" ||
                      team.members.length >= team.capacity
                    }
                    onClick={() =>
                      act(
                        () =>
                          reviewProjectEntry(
                            "projectTeamRequests",
                            i,
                            user.uid,
                            "accepted",
                          ),
                        "Student joined the team.",
                      )
                    }
                  >
                    Accept member
                  </button>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () =>
                          reviewProjectEntry(
                            "projectTeamRequests",
                            i,
                            user.uid,
                            "declined",
                          ),
                        "Join request declined.",
                      )
                    }
                  >
                    Decline request
                  </button>
                </div>
              </article>
            ))}
        </section>
      )}
      <section className="panel chat-coming-soon">
        <h3>Team chat</h3>
        <p className="hint">
          Realtime chat is under development and will be available in upcoming
          releases.
        </p>
      </section>
      <details
        className="panel"
        onToggle={(e) => setHistoryOpen(e.currentTarget.open)}
      >
        <summary>Team history · revision {team.version}</summary>
        <p>
          Append-only snapshots preserve membership, roles, capacity, required
          skills and team status. Earlier records are not overwritten.
        </p>
        <FeedStatus feed={history} />
        {history.items.map((h) => (
          <article key={h.id}>
            <h4>
              Revision {h.snapshot.version} ·{" "}
              {h.createdAt?.toDate?.().toLocaleString() || "Saving…"}
            </h4>
            <p>
              Changed by <MemberName uid={h.actorId} />
            </p>
            <p>
              {h.snapshot.title} · {h.snapshot.members.length}/
              {h.snapshot.capacity} members · {h.snapshot.recruitment} ·{" "}
              {h.snapshot.lifecycle}
            </p>
            <details>
              <summary>View saved team state</summary>
              <p>{h.snapshot.description}</p>
              <div className="skill-row">
                {h.snapshot.requiredSkills.map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              <ul>
                {h.snapshot.members.map((uid) => (
                  <li key={uid}>
                    <MemberName uid={uid} /> · {h.snapshot.roles[uid]}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
        {history.items.length === historySize && (
          <button
            className="text-link"
            onClick={() => setHistorySize((n) => n + 20)}
          >
            Load older history
          </button>
        )}
      </details>
    </>
  );
}
export function ProjectTeamBoard({ user, act, busy, myPublic }) {
  const [listingLimit, setListingLimit] = useState(48);
  const feed = useTeamFeed(
      "teamListings",
      user.uid,
      [["lifecycle", "==", "active"]],
      listingLimit,
    ),
    mine = useTeamFeed("projectTeams", user.uid, [
      ["members", "array-contains", user.uid],
    ]),
    requests = useTeamFeed("projectTeamRequests", user.uid, [
      ["studentId", "==", user.uid],
    ]),
    [search, setSearch] = useState(""),
    [joining, setJoining] = useState(null);
  const rows = feed.items.filter((t) =>
    (t.title + " " + t.requiredSkills.join(" "))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <label className="directory-search">
        Search recruiting project teams
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Team name or required skill"
        />
      </label>
      <FeedStatus feed={feed} />
      <FeedStatus feed={mine} />
      <FeedStatus feed={requests} />
      {!myPublic && (
        <p className="hint">
          Make your discovery profile visible above before requesting to join a
          team.
        </p>
      )}
      {joining && (
        <form
          className="panel discovery-form"
          onSubmit={(e) => {
            e.preventDefault();
            const note = new FormData(e.currentTarget).get("note");
            act(async () => {
              await requestProjectJoin(user.uid, joining, note);
              setJoining(null);
            }, "Join request sent. The leader will review your introduction.");
          }}
        >
          <h3>Request to join {joining.title}</h3>
          <label>
            Introduce yourself
            <textarea name="note" maxLength={1000} required rows={3} />
          </label>
          <div className="hub-actions">
            <button
              className="button"
              disabled={
                busy ||
                !myPublic ||
                feed.loading ||
                mine.loading ||
                requests.loading ||
                !!(feed.error || mine.error || requests.error)
              }
            >
              Send join request
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setJoining(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="hub-people">
        {rows.map((t) => (
          <article className="panel team-project-card" key={t.id}>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <div className="skill-row">
              {t.requiredSkills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <p>
              {t.memberCount}/{t.capacity} members ·{" "}
              {t.memberCount >= t.capacity ? "Full" : t.recruitment}
            </p>
            <button
              className="button secondary"
              disabled={
                busy ||
                !myPublic ||
                feed.loading ||
                mine.loading ||
                requests.loading ||
                !!(feed.error || mine.error || requests.error) ||
                requests.items.some(
                  (r) =>
                    r.teamId === t.teamId &&
                    ["pending", "accepted"].includes(r.status),
                ) ||
                t.ownerId === user.uid ||
                mine.items.some((x) => x.id === t.teamId) ||
                t.memberCount >= t.capacity ||
                t.recruitment === "closed"
              }
              onClick={() => setJoining(t)}
            >
              {mine.items.some((x) => x.id === t.teamId) ||
              t.ownerId === user.uid
                ? "Already a member"
                : requests.items.some(
                      (r) => r.teamId === t.teamId && r.status === "pending",
                    )
                  ? "Request sent"
                  : t.memberCount >= t.capacity
                    ? "Team full"
                    : t.recruitment === "closed"
                      ? "Team closed"
                      : "Request to join"}
            </button>
          </article>
        ))}
      </div>
      {feed.items.length === listingLimit && listingLimit < 1968 && (
        <button
          className="button secondary"
          disabled={feed.loading}
          onClick={() => setListingLimit((n) => n + 48)}
        >
          Load more teams
        </button>
      )}
      {!feed.loading && !feed.error && !feed.cached && !rows.length && (
        <p className="panel">
          No recruiting teams match these criteria. Create a team from My Teams.
        </p>
      )}
    </>
  );
}
function ProjectTitle({ id }) {
  const [title, setTitle] = useState("Team invitation");
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      doc(db, "projectTeams", id),
      (s) => setTitle(s.data()?.title || "Team invitation"),
      () => setTitle("Team invitation unavailable"),
    );
  }, [id]);
  return <>{title}</>;
}
