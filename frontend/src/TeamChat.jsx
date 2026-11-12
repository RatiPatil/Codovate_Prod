import {
  Send,
  ArrowLeft,
  MessageCircle,
  Users,
  Check,
  CheckCheck,
  LockKeyhole,
} from "lucide-react";
import {
  setChatTyping,
  markChatRead,
  messageReadCount,
  TYPING_VISIBLE_MS,
} from "./chatSignals";
import { Fragment, useEffect, useRef, useState } from "react";
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
  connectionDecision,
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
    [messagesReady, setMessagesReady] = useState(false),
    [notice, setNotice] = useState(""),
    [clock, setClock] = useState(Date.now()),
    [atBottom, setAtBottom] = useState(true),
    [newMessages, setNewMessages] = useState(false);
  const lastTyping = useRef(0),
    lastRead = useRef(""),
    readFailureAt = useRef(0),
    typingWasSet = useRef(false);
  const signalMembers = team?.members || room?.members || [];
  const signalFilters = signalMembers.length
    ? [["uid", "in", signalMembers]]
    : [];
  const receipts = useTeamFeed(
    room && signalMembers.length ? `conversations/${id}/readReceipts` : null,
    user.uid,
    signalFilters,
    12,
  );
  const typing = useTeamFeed(
    room && signalMembers.length ? `conversations/${id}/typing` : null,
    user.uid,
    signalFilters,
    12,
  );
  const panel = useRef(null);
  useEffect(() => {
    panel.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }, [id]);
  const retry = useRef(null),
    lock = useRef(false),
    list = useRef(null),
    historyStarted = useRef(false),
    liveHead = useRef([]);
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
          const nextMessages = s.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            pending: !!d.metadata?.hasPendingWrites,
          }));
          if (historyStarted.current) {
            const ids = new Set(nextMessages.map((item) => item.id));
            const shifted = liveHead.current.filter(
              (item) => !ids.has(item.id),
            );
            if (shifted.length)
              setOlder((current) =>
                [...current, ...shifted].filter(
                  (item, index, all) =>
                    all.findIndex((other) => other.id === item.id) === index,
                ),
              );
          }
          liveHead.current = nextMessages;
          setMessages(nextMessages);
          setMessagesReady(true);
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
    if (!list.current) return;
    if (atBottom || messages[0]?.senderId === user.uid) {
      list.current.scrollTop = list.current.scrollHeight;
      setNewMessages(false);
    } else setNewMessages(true);
  }, [messages[0]?.id]);
  useEffect(() => {
    if (!room) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [room?.id]);
  const participants = team?.members || room?.members || [];
  const activeTyping = typing.items.filter(
    (item) =>
      item.uid !== user.uid &&
      participants.includes(item.uid) &&
      item.active &&
      clock - (item.updatedAt?.toMillis?.() || 0) >= 0 &&
      clock - (item.updatedAt?.toMillis?.() || 0) < TYPING_VISIBLE_MS,
  );
  const latest = all.filter((message) => message.senderId !== user.uid).at(-1);
  useEffect(() => {
    if (
      !room ||
      cached ||
      error ||
      !atBottom ||
      document.visibilityState !== "visible" ||
      !latest?.createdAt ||
      latest.pending ||
      readFailureAt.current > Date.now()
    )
      return;
    const key = id + ":" + latest.id;
    if (lastRead.current === key) return;
    lastRead.current = key;
    markChatRead(id, user.uid, latest.id).catch(() => {
      lastRead.current = "";
      readFailureAt.current = Date.now() + 5000;
    });
  }, [
    id,
    room?.id,
    latest?.id,
    !!latest?.createdAt,
    latest?.pending,
    cached,
    error,
    atBottom,
    clock,
  ]);
  useEffect(
    () => () => {
      if (db && typingWasSet.current)
        setChatTyping(id, user.uid, false).catch(() => {});
    },
    [id, user.uid],
  );
  function signalTyping(active) {
    if (!room || (active && closed)) return;
    if (
      active &&
      typingWasSet.current &&
      Date.now() - lastTyping.current < 3000
    )
      return;
    if (!active && !typingWasSet.current) return;
    typingWasSet.current = active;
    lastTyping.current = Date.now();
    setChatTyping(id, user.uid, active).catch(() => {});
  }
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
    const previousHeight = list.current?.scrollHeight || 0,
      previousTop = list.current?.scrollTop || 0;
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
      requestAnimationFrame(() => {
        if (list.current)
          list.current.scrollTop =
            previousTop + list.current.scrollHeight - previousHeight;
      });
    } catch {
      setError("Could not load older messages.");
    } finally {
      setPaging(false);
    }
  }
  const closed =
    !room ||
    !messagesReady ||
    cached ||
    (team
      ? team.lifecycle === "archived"
      : room.kind === "group" && room.status !== "active");
  return (
    <section
      className="panel hub-chat"
      ref={panel}
      aria-label="Team conversation"
    >
      <div className="hub-chat-heading">
        <div>
          <span className="eyebrow">
            <LockKeyhole size={12} aria-hidden="true" /> PRIVATE CONVERSATION
          </span>
          <h2>
            <span className="chat-heading-icon" aria-hidden="true">
              {room?.kind === "direct" ? (
                <MessageCircle size={22} />
              ) : (
                <Users size={22} />
              )}
            </span>
            {team?.title ||
              (room?.kind === "group" ? (
                room.title
              ) : room?.kind === "direct" ? (
                <MemberName
                  uid={room.members.find((uid) => uid !== user.uid)}
                  fallback="Connected student"
                />
              ) : (
                "Direct conversation"
              ))}
          </h2>
          <small>
            {!messagesReady
              ? "Connecting to chat…"
              : cached
                ? "Reconnecting · saved messages"
                : "Messages update live"}
          </small>
        </div>
        <div className="hub-actions">
          {room?.kind === "direct" && (
            <button
              className="text-link"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Block this connection and revoke direct chat access?",
                  )
                )
                  action(async () => {
                    await connectionDecision(room.connectionId, "blocked");
                    onClose();
                  });
              }}
            >
              Block connection
            </button>
          )}
          <button className="button secondary" onClick={onClose}>
            <ArrowLeft size={15} aria-hidden="true" /> Close chat
          </button>
        </div>
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
                    <select
                      name="member"
                      aria-label="Invite a discoverable member"
                      required
                    >
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
      <div
        className="hub-messages"
        ref={list}
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        onScroll={() => {
          if (list.current) {
            const bottom =
              list.current.scrollHeight -
                list.current.scrollTop -
                list.current.clientHeight <
              80;
            setAtBottom(bottom);
            if (bottom) setNewMessages(false);
          }
        }}
      >
        {all.map((m, index) => (
          <Fragment key={m.id}>
            {(index === 0 ||
              m.createdAt?.toDate?.().toDateString() !==
                all[index - 1].createdAt?.toDate?.().toDateString()) && (
              <p className="chat-day">
                {m.createdAt?.toDate?.().toDateString() ===
                new Date().toDateString()
                  ? "Today"
                  : m.createdAt?.toDate?.().toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) || "Today"}
              </p>
            )}
            <article
              className={
                m.senderId === user.uid ? "hub-message mine" : "hub-message"
              }
              key={m.id}
            >
              {room?.kind !== "direct" && m.senderId !== user.uid && (
                <strong>{m.senderName}</strong>
              )}
              <p>{m.text}</p>
              <small className="message-meta">
                <span title={m.createdAt?.toDate?.().toLocaleString()}>
                  {m.createdAt?.toDate?.().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "Sending…"}
                </span>
                {m.senderId === user.uid && m.createdAt && !m.pending && (
                  <span
                    className={
                      messageReadCount(
                        m,
                        receipts.items,
                        participants,
                        user.uid,
                      )
                        ? "message-read"
                        : ""
                    }
                  >
                    {messageReadCount(
                      m,
                      receipts.items,
                      participants,
                      user.uid,
                    ) ? (
                      <>
                        <CheckCheck size={14} aria-hidden="true" />
                        {room?.kind === "direct"
                          ? "Read"
                          : `Read by ${messageReadCount(m, receipts.items, participants, user.uid)}`}
                      </>
                    ) : (
                      <>
                        <Check size={14} aria-hidden="true" />
                        Sent
                      </>
                    )}
                  </span>
                )}
              </small>
            </article>
          </Fragment>
        ))}
        {!all.length && !error && (
          <p className="hint">Start with a hello, your idea or a question.</p>
        )}
      </div>
      {newMessages && (
        <button
          className="chat-new-messages"
          onClick={() => {
            if (list.current)
              list.current.scrollTop = list.current.scrollHeight;
            setAtBottom(true);
            setNewMessages(false);
          }}
        >
          New messages ↓
        </button>
      )}
      <div className="chat-typing" aria-live="polite">
        {activeTyping.length > 0 && (
          <>
            <span className="typing-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              {activeTyping.length === 1 ? (
                <>
                  <MemberName uid={activeTyping[0].uid} fallback="A teammate" />{" "}
                  is typing…
                </>
              ) : (
                "Teammates are typing…"
              )}
            </span>
          </>
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
            signalTyping(false);
            retry.current = null;
          });
        }}
      >
        <label>
          Message
          <textarea
            aria-label="Message"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              signalTyping(!!e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                !closed &&
                !busy &&
                draft.trim()
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={1500}
            rows={2}
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
            <Send size={17} aria-hidden="true" />{" "}
            {busy ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </section>
  );
}
