import { useEffect, useRef, useState } from "react";
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
import {
  useTeamFeed,
  inviteToGroup,
  updateGroup,
  sendTeamMessage,
  revokeGroupInvite,
} from "./teamHubData";
import { FeedStatus, MemberName } from "./TeamWidgets";
export function TeamChat({ id, onClose, team = null }) {
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
  const profiles = useTeamFeed(
    room?.kind === "group" && room.ownerId === user.uid
      ? "memberProfiles"
      : null,
    user.uid,
    [],
    profileLimit,
  );
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
  const closed =
    !room ||
    (team
      ? team.lifecycle === "archived"
      : room.kind === "group" && room.status !== "active");
  return (
    <section className="panel hub-chat" aria-label="Team conversation">
      <div className="hub-chat-heading">
        <div>
          <span className="eyebrow">PRIVATE COLLABORATION</span>
          <h2>
            {team?.title ||
              (room?.kind === "group" ? room.title : "Direct conversation")}
          </h2>
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
