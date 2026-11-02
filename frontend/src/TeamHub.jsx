import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";
import { useSession } from "./session";
import { Teams } from "./Community";
import {
  useTeamFeed,
  publishMember,
  hideMember,
  connectMember,
  connectionDecision,
  openDirect,
  createGroup,
  inviteToGroup,
  answerInvite,
  updateGroup,
  sendTeamMessage,
  revokeGroupInvite,
} from "./teamHubData";
import "./teamHub.css";
function FeedStatus({ feed }) {
  return feed.error ? (
    <p role="alert" className="hub-error">
      {feed.error}
    </p>
  ) : (
    <p className="hint" role="status">
      {feed.loading
        ? "Connecting…"
        : feed.cached
          ? "Saved records · reconnecting"
          : "Live updates connected"}
    </p>
  );
}
export function TeamHub() {
  const { user, profile } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = ["connections", "groups", "recruiting"].includes(
    params.get("hub"),
  )
    ? params.get("hub")
    : "people";
  const [size, setSize] = useState(48),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState("");
  const lock = useRef(false);
  const people = useTeamFeed("memberProfiles", user?.uid, [], size);
  const sent = useTeamFeed("connections", user?.uid, [
    ["fromId", "==", user?.uid || ""],
  ]);
  const received = useTeamFeed("connections", user?.uid, [
    ["toId", "==", user?.uid || ""],
  ]);
  const groups = useTeamFeed("conversations", user?.uid, [
    ["kind", "==", "group"],
    ["members", "array-contains", user?.uid || ""],
  ]);
  const invites = useTeamFeed("groupInvites", user?.uid, [
    ["studentId", "==", user?.uid || ""],
  ]);
  const [myPublic, setMyPublic] = useState(false);
  useEffect(() => {
    setSelected("");
    setMyPublic(false);
    if (!db || !user) return;
    return onSnapshot(
      doc(db, "memberProfiles", user.uid),
      (s) => setMyPublic(s.exists()),
      () => setMyPublic(false),
    );
  }, [user?.uid]);
  const members = new Map(people.items.map((p) => [p.uid, p]));
  const name = (uid) => (
    <MemberName
      key={uid}
      uid={uid}
      fallback={
        members.get(uid)?.name ||
        (uid === user?.uid ? profile?.name || "You" : "Member")
      }
    />
  );
  const connections = [...sent.items, ...received.items].filter(
    (v, i, a) => a.findIndex((x) => x.id === v.id) === i,
  );
  async function act(action, message) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (message) setNotice(message);
    } catch (e) {
      setError(
        e.code === "permission-denied"
          ? "Access changed. Check membership and deployed Firebase rules."
          : e.message || "Request failed. Please retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!user) return null;
  return (
    <div className="team-hub">
      <section className="panel hub-intro">
        <span className="eyebrow">BUILD TOGETHER</span>
        <h2>Good people. Shared ambition.</h2>
        <p>
          Find complementary skills, make real connections and collaborate in
          private group chats.
        </p>
        <p className="hint">
          Discovery shares only your name and confirmed skills. Your email,
          mobile, résumé and private learning records stay hidden.
        </p>
        <div className="hub-actions">
          <button
            className="button secondary"
            disabled={busy || !db}
            onClick={() =>
              act(
                () =>
                  myPublic
                    ? hideMember(user.uid)
                    : publishMember(user, profile),
                myPublic
                  ? "Your discovery profile is hidden."
                  : "Your name and confirmed skills are now discoverable.",
              )
            }
          >
            {myPublic
              ? "Hide my discovery profile"
              : "Make my profile discoverable"}
          </button>
          <Link className="text-link" to="/profile">
            Edit name & skills
          </Link>
        </div>
      </section>
      <div
        className="type-tabs hub-tabs"
        role="group"
        aria-label="Collaboration views"
      >
        {[
          ["people", "Find teammates"],
          ["connections", "Connections"],
          ["groups", "My groups"],
          ["recruiting", "Recruiting teams"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-pressed={tab === id}
            onClick={() => {
              setParams({ hub: id });
              setSelected("");
              setError("");
              setNotice("");
            }}
          >
            {label}
            {id === "connections" &&
            received.items.some((c) => c.status === "pending")
              ? " •"
              : ""}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="hub-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="hub-success">
          {notice}
        </p>
      )}
      {tab === "people" && (
        <>
          <label className="directory-search">
            Search loaded members by name or skill
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, React, design, civil engineering…"
            />
          </label>
          <FeedStatus feed={people} />
          {!people.loading && !people.error && !people.items.length && (
            <div className="panel">
              <h3>Be the first to connect.</h3>
              <p>
                Publish your discovery profile above. Members appear here only
                after choosing to share their name and skills.
              </p>
            </div>
          )}
          <div className="hub-people">
            {people.items
              .filter((p) =>
                (p.name + " " + p.skills.join(" "))
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
              )
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => {
                const relation = connections.find((c) =>
                  [c.fromId, c.toId].includes(p.uid),
                );
                return (
                  <article className="panel hub-person" key={p.uid}>
                    <div className="hub-avatar" aria-hidden="true">
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <h3>{p.name}</h3>
                    <div className="skill-row">
                      {p.skills.length ? (
                        p.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))
                      ) : (
                        <small>Skills not added yet</small>
                      )}
                    </div>
                    {p.uid === user.uid ? (
                      <span className="hint">Your public discovery card</span>
                    ) : relation ? (
                      <button
                        className="button secondary"
                        onClick={() => setParams({ hub: "connections" })}
                      >
                        Connection: {relation.status}
                      </button>
                    ) : (
                      <button
                        className="button secondary"
                        disabled={busy || !myPublic}
                        onClick={() =>
                          act(
                            () => connectMember(user.uid, p.uid),
                            "Connection request sent.",
                          )
                        }
                      >
                        Connect
                      </button>
                    )}
                  </article>
                );
              })}
          </div>
          {!myPublic && (
            <p className="hint">
              Make your profile discoverable before sending a connection
              request.
            </p>
          )}
          {people.items.length === size && size < 1968 && (
            <button
              className="button secondary"
              onClick={() => setSize((n) => n + 48)}
            >
              Load more members
            </button>
          )}
          <p className="hint">
            Showing up to {size} opted-in members. Search applies to loaded
            profiles.
          </p>
        </>
      )}
      {tab === "connections" && (
        <>
          <FeedStatus
            feed={{
              ...sent,
              error: sent.error || received.error,
              loading: sent.loading || received.loading,
              cached: sent.cached || received.cached,
            }}
          />
          <div className="hub-list">
            {connections.map((c) => {
              const other = c.fromId === user.uid ? c.toId : c.fromId;
              return (
                <section className="panel hub-connection" key={c.id}>
                  <div>
                    <h3>{name(other)}</h3>
                    <span className="request-state">{c.status}</span>
                    <p className="hint">
                      {c.fromId === user.uid
                        ? "Request sent by you"
                        : "Request received"}
                    </p>
                  </div>
                  <div className="hub-actions">
                    {c.status === "pending" && c.toId === user.uid && (
                      <>
                        <button
                          className="button"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => connectionDecision(c.id, "accepted"),
                              "Connection accepted. You can now chat.",
                            )
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => connectionDecision(c.id, "declined"),
                              "Connection declined.",
                            )
                          }
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {c.status === "blocked" && c.blockedBy === user.uid && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          act(
                            () => connectionDecision(c.id, "declined"),
                            "Connection unblocked. A new request is required before chatting.",
                          )
                        }
                      >
                        Unblock
                      </button>
                    )}
                    {["declined", "withdrawn"].includes(c.status) &&
                      c.fromId === user.uid && (
                        <button
                          className="button secondary"
                          disabled={busy || !myPublic}
                          onClick={() =>
                            act(
                              () => connectionDecision(c.id, "pending"),
                              "Connection request sent again.",
                            )
                          }
                        >
                          Send request again
                        </button>
                      )}
                    {c.status === "accepted" && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() =>
                          act(async () => setSelected(await openDirect(c)))
                        }
                      >
                        Open chat
                      </button>
                    )}
                    {["pending", "accepted"].includes(c.status) && (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Block this connection? Both members will lose access to its direct chat.",
                            )
                          ) {
                            setSelected("");
                            act(
                              () => connectionDecision(c.id, "blocked"),
                              "Connection blocked.",
                            );
                          }
                        }}
                      >
                        Block
                      </button>
                    )}
                    {c.fromId === user.uid && c.status === "pending" && (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          act(
                            () => connectionDecision(c.id, "withdrawn"),
                            "Request cancelled.",
                          )
                        }
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          {!connections.length && !sent.loading && !received.loading && (
            <p className="panel">
              No connections yet. Find teammates and send an introduction.
            </p>
          )}
          {selected && (
            <TeamChat
              key={user.uid + selected}
              id={selected}
              onClose={() => setSelected("")}
            />
          )}
        </>
      )}
      {tab === "groups" && (
        <>
          <form
            className="panel hub-create"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              act(async () => {
                const id = await createGroup(
                  user.uid,
                  new FormData(form).get("title"),
                );
                setSelected(id);
                form.reset();
              }, "Group created. Invite members below.");
            }}
          >
            <label>
              New project group
              <input
                name="title"
                maxLength={100}
                required
                placeholder="Give your collaboration a name"
              />
            </label>
            <button className="button" disabled={busy || !db}>
              Create group
            </button>
          </form>
          <FeedStatus
            feed={{
              ...groups,
              error: groups.error || invites.error,
              loading: groups.loading || invites.loading,
              cached: groups.cached || invites.cached,
            }}
          />
          {invites.items
            .filter((i) => i.status === "pending")
            .map((i) => (
              <section className="panel hub-connection" key={i.id}>
                <div>
                  <h3>
                    <InvitationTitle groupId={i.groupId} />
                  </h3>
                  <p>Invitation from {name(i.ownerId)}</p>
                  <p className="hint">
                    Accept to share messages with this group. Contact details
                    stay private.
                  </p>
                </div>
                <div className="hub-actions">
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => answerInvite(i, "accepted"),
                        "You joined the group.",
                      )
                    }
                  >
                    Accept invitation
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => answerInvite(i, "declined"),
                        "Invitation declined.",
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </section>
            ))}
          <div className="hub-people">
            {groups.items.map((g) => (
              <section className="panel" key={g.id}>
                <h3>{g.title}</h3>
                <p>
                  {g.members.length}/12 members · {g.status}
                </p>
                <button
                  className="button secondary"
                  onClick={() => setSelected(g.id)}
                >
                  Open workspace
                </button>
              </section>
            ))}
          </div>
          {!groups.items.length && !groups.loading && (
            <p className="panel">
              Start a group or accept an invitation to build together.
            </p>
          )}
          {selected && (
            <TeamChat
              key={user.uid + selected}
              id={selected}
              onClose={() => setSelected("")}
            />
          )}
        </>
      )}
      {tab === "recruiting" && <Teams />}
    </div>
  );
}
function TeamChat({ id, onClose }) {
  const { user, profile } = useSession();
  const [room, setRoom] = useState(null),
    [messages, setMessages] = useState([]),
    [older, setOlder] = useState([]),
    [cursor, setCursor] = useState(null),
    [more, setMore] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [paging, setPaging] = useState(false),
    [draft, setDraft] = useState(""),
    [cached, setCached] = useState(false),
    [notice, setNotice] = useState("");
  const retry = useRef(null),
    lock = useRef(false),
    list = useRef(null),
    historyStarted = useRef(false);
  const [profileLimit, setProfileLimit] = useState(48);
  const profiles = useTeamFeed("memberProfiles", user.uid, [], profileLimit);
  const outgoingInvites = useTeamFeed(
    room?.kind === "group" && room.ownerId === user.uid ? "groupInvites" : null,
    user.uid,
    [
      ["groupId", "==", id],
      ["ownerId", "==", user.uid],
    ],
  );
  useEffect(() => {
    if (!db) return;
    let active = true;
    const stopRoom = onSnapshot(
      doc(db, "conversations", id),
      (s) => {
        if (active) {
          setRoom(s.exists() ? { id: s.id, ...s.data() } : null);
          if (!s.exists()) setError("Conversation no longer available.");
        }
      },
      () => {
        if (active) {
          setRoom(null);
          setMessages([]);
          setOlder([]);
          setError(
            "Chat access is unavailable. The connection or group membership may have changed.",
          );
        }
      },
    );
    const stopMessages = onSnapshot(
      query(
        collection(db, "conversations", id, "messages"),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      { includeMetadataChanges: true },
      (s) => {
        if (active) {
          setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          if (!historyStarted.current) {
            setCursor(s.docs.at(-1) || null);
            setMore(s.size === 50);
          }
          setCached(s.metadata.fromCache);
        }
      },
      () => {
        if (active) {
          setMessages([]);
          setOlder([]);
          setError(
            "Messages are unavailable. Check your membership and connection.",
          );
        }
      },
    );
    return () => {
      active = false;
      stopRoom();
      stopMessages();
    };
  }, [id, user.uid]);
  const all = (room ? [...messages, ...older] : [])
    .filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i)
    .sort(
      (a, b) =>
        (a.createdAt?.toMillis?.() || Date.now()) -
        (b.createdAt?.toMillis?.() || Date.now()),
    );
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages.length]);
  async function action(fn, success = "") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (success) setNotice(success);
    } catch (e) {
      setError(
        e.code === "permission-denied"
          ? "You no longer have permission to do this."
          : e.message || "Could not complete this action.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function loadOlder() {
    if (!cursor || paging) return;
    historyStarted.current = true;
    setPaging(true);
    try {
      const s = await getDocs(
        query(
          collection(db, "conversations", id, "messages"),
          orderBy("createdAt", "desc"),
          startAfter(cursor),
          limit(50),
        ),
      );
      setOlder((o) => [
        ...o,
        ...s.docs.map((d) => ({ id: d.id, ...d.data() })),
      ]);
      setCursor(s.docs.at(-1) || null);
      setMore(s.size === 50);
    } catch {
      setError("Could not load older messages.");
    } finally {
      setPaging(false);
    }
  }
  const closed = !room || (room.kind === "group" && room.status !== "active");
  return (
    <section className="panel hub-chat" aria-label="Team conversation">
      <div className="hub-chat-heading">
        <div>
          <span className="eyebrow">PRIVATE COLLABORATION</span>
          <h2>{room?.kind === "group" ? room.title : "Direct conversation"}</h2>
          <small>
            {cached ? "Reconnecting · saved messages" : "Messages update live"}
          </small>
        </div>
        <button className="button secondary" onClick={onClose}>
          Close chat
        </button>
      </div>
      {error && (
        <p className="hub-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="hub-success" role="status">
          {notice}
        </p>
      )}
      {room?.kind === "group" && (
        <details className="hub-members">
          <summary>Group members ({room.members.length}/12)</summary>
          <ul>
            {room.members.map((uid) => (
              <li key={uid}>
                <MemberName
                  uid={uid}
                  fallback={uid === user.uid ? profile?.name : "Member"}
                />
                {uid === room.ownerId ? " · Owner" : ""}
                {room.ownerId === user.uid && uid !== user.uid && (
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this member and revoke their chat access?",
                        )
                      )
                        action(() => updateGroup(room, "remove", uid));
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {room.status === "active" &&
            (room.ownerId === user.uid ? (
              <>
                <form
                  className="hub-create"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    action(async () => {
                      await inviteToGroup(room, new FormData(f).get("member"));
                      f.reset();
                    }, "Invitation sent. Your teammate must accept it before joining.");
                  }}
                >
                  <label>
                    Invite a discoverable member
                    <select name="member" required>
                      <option value="">Choose a member</option>
                      {profiles.items
                        .filter((p) => !room.members.includes(p.uid))
                        .map((p) => (
                          <option key={p.uid} value={p.uid}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    className="button secondary"
                    disabled={busy || room.members.length >= 12}
                  >
                    Send invitation
                  </button>
                </form>
                {profiles.items.length === profileLimit &&
                  profileLimit < 1968 && (
                    <button
                      className="text-link"
                      onClick={() => setProfileLimit((n) => n + 48)}
                    >
                      Load more invitees
                    </button>
                  )}
                <FeedStatus feed={profiles} />
                <FeedStatus feed={outgoingInvites} />
                {outgoingInvites.items
                  .filter((i) => i.status === "pending")
                  .map((i) => (
                    <p key={i.id}>
                      <MemberName uid={i.studentId} /> · Invitation pending{" "}
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          action(
                            () => revokeGroupInvite(i.id),
                            "Invitation cancelled.",
                          )
                        }
                      >
                        Cancel invitation
                      </button>
                    </p>
                  ))}
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Archive this group? Existing members can read its history, but nobody can send new messages.",
                      )
                    )
                      action(() => updateGroup(room, "archive"));
                  }}
                >
                  Archive group
                </button>
              </>
            ) : (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Leave this group and revoke your chat access?",
                    )
                  )
                    action(async () => {
                      await updateGroup(room, "leave", user.uid);
                      onClose();
                    });
                }}
              >
                Leave group
              </button>
            ))}
        </details>
      )}
      {room?.kind === "group" &&
        room.status === "archived" &&
        room.ownerId !== user.uid && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              action(async () => {
                await updateGroup(room, "leave", user.uid);
                onClose();
              })
            }
          >
            Leave archived group
          </button>
        )}
      {more && (
        <button className="text-link" disabled={paging} onClick={loadOlder}>
          {paging ? "Loading…" : "Load older messages"}
        </button>
      )}
      <div className="hub-messages" ref={list} role="log" aria-live="polite">
        {all.map((m) => (
          <article
            className={
              m.senderId === user.uid ? "hub-message mine" : "hub-message"
            }
            key={m.id}
          >
            <strong>{m.senderId === user.uid ? "You" : m.senderName}</strong>
            <p>{m.text}</p>
            <small>
              {m.createdAt?.toDate?.().toLocaleString() || "Sending…"}
            </small>
          </article>
        ))}
        {!all.length && !error && (
          <p className="hint">Start with a hello, your idea or a question.</p>
        )}
      </div>
      <form
        className="hub-compose"
        onSubmit={(e) => {
          e.preventDefault();
          action(async () => {
            if (!profile?.name)
              throw new Error("Complete your profile name first.");
            if (!retry.current || retry.current.text !== draft)
              retry.current = {
                text: draft,
                id: doc(collection(db, "conversations", id, "messages")).id,
              };
            await sendTeamMessage(
              id,
              retry.current.id,
              user.uid,
              profile.name,
              draft,
            );
            setDraft("");
            retry.current = null;
          });
        }}
      >
        <label>
          Message
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1500}
            rows={3}
            required
            disabled={closed || busy}
            placeholder={
              closed
                ? "This conversation is unavailable or archived"
                : "Share your next step…"
            }
          />
        </label>
        <div className="hub-actions">
          <small>
            {draft.length}/1500 · Share contact details only if you choose to.
          </small>
          <button className="button" disabled={closed || busy || !draft.trim()}>
            {busy ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </section>
  );
}

function MemberName({ uid, fallback = "Member" }) {
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    setEntry(null);
    if (!db || !uid) return;
    return onSnapshot(
      doc(db, "memberProfiles", uid),
      (s) => setEntry({ uid, name: s.data()?.name || fallback }),
      () => setEntry(null),
    );
  }, [uid, fallback]);
  return <>{entry?.uid === uid ? entry.name : fallback}</>;
}
function InvitationTitle({ groupId }) {
  const [title, setTitle] = useState("Group invitation");
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      doc(db, "conversations", groupId),
      (s) =>
        setTitle(
          s.exists()
            ? s.data().title +
                (s.data().status === "archived" ? " · Archived" : "")
            : "Group invitation unavailable",
        ),
      () => setTitle("Group invitation unavailable"),
    );
  }, [groupId]);
  return <>{title}</>;
}
