import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { MessageCircle, Send } from "lucide-react";
import { db } from "./firebase";
import { useSession } from "./session";
import { mentorMessageId, sendMentorMessage } from "./mentorChatData";
export default function MentorChat({ booking }) {
  const { user } = useSession();
  const [count, setCount] = useState(50),
    [state, setState] = useState({ rows: [], loading: true, error: "" });
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const retry = useRef(null),
    locked = useRef(false);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      query(
        collection(db, "mentorBookings", booking.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(count),
      ),
      (snap) =>
        setState({
          rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse(),
          loading: false,
          error: "",
        }),
      () =>
        setState({
          rows: [],
          loading: false,
          error: "Could not load this conversation. Close it and try again.",
        }),
    );
  }, [booking.id, count]);
  async function send(e) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      retry.current ||= { id: mentorMessageId(booking.id), text: text.trim() };
      if (retry.current.text !== text.trim())
        throw new Error(
          "Retry your previous message before changing its text, or reopen the conversation to check whether it was saved.",
        );
      await sendMentorMessage(booking.id, retry.current.id, user.uid, text);
      retry.current = null;
      setText("");
    } catch (e) {
      setError(
        e.code
          ? "Message not confirmed. Your text is still here; retry to check and send it safely."
          : e.message,
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="mentor-chat"
      aria-label="Private mentoring conversation"
    >
      <h4>
        <MessageCircle size={18} /> Session conversation
      </h4>
      <p className="hint">
        Private to this student, the assigned mentor and authorized Codovate
        admins. Messages update live. Share questions and progress; never share
        passwords or OTPs.
      </p>
      {state.loading && <p role="status">Loading conversation…</p>}
      {state.error && <p role="alert">{state.error}</p>}
      {!state.loading && !state.error && !state.rows.length && (
        <p className="hint">
          Start with your question and what you have already tried.
        </p>
      )}
      {state.rows.length === count && count < 200 && (
        <button
          className="text-link"
          onClick={() => setCount((n) => Math.min(n + 50, 200))}
        >
          Load earlier messages
        </button>
      )}
      {state.rows.length === 200 && (
        <p className="hint">Showing the latest 200 messages.</p>
      )}
      <ol className="mentor-messages" aria-label="Messages">
        {state.rows.map((m) => (
          <li
            key={m.id}
            className={
              m.senderId === user?.uid
                ? "mentor-message mine"
                : "mentor-message"
            }
          >
            <div>
              <strong>
                {m.senderId === user?.uid
                  ? "You"
                  : m.senderRole === "mentor"
                    ? booking.mentorName
                    : m.senderRole === "student"
                      ? booking.studentName
                      : "Codovate coordinator"}
              </strong>
              <time>
                {m.createdAt
                  ?.toDate?.()
                  .toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) || "Sending…"}
              </time>
            </div>
            <p>{m.text}</p>
          </li>
        ))}
      </ol>
      {booking.status === "confirmed" && !state.error ? (
        <form onSubmit={send}>
          <label>
            Message
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={2000}
              rows={3}
              disabled={busy}
              placeholder="Ask a specific question or share an update…"
            />
          </label>
          <button className="button" disabled={busy || !text.trim()}>
            <Send size={15} />
            {busy ? "Sending…" : "Send message"}
          </button>
        </form>
      ) : (
        <p className="hint">
          Messaging is available for confirmed bookings. Past and closed
          conversations remain read-only.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
