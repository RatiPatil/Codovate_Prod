import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { withTimeout } from "./authSupport";
export const mentorMessageId = (bookingId) =>
  doc(collection(db, "mentorBookings", bookingId, "messages")).id;
export function mentorMessageText(raw) {
  const text = String(raw || "").trim();
  if (!text || text.length > 2000)
    throw new Error("Write a message of 1–2,000 characters.");
  return text;
}
export async function sendMentorMessage(bookingId, messageId, uid, raw) {
  const text = mentorMessageText(raw);
  if (!uid || !messageId) throw new Error("Sign in before sending a message.");
  return withTimeout(
    runTransaction(db, async (tx) => {
      const ref = doc(db, "mentorBookings", bookingId, "messages", messageId);
      const [booking, previous] = await Promise.all([
        tx.get(doc(db, "mentorBookings", bookingId)),
        tx.get(ref),
      ]);
      if (!booking.exists()) throw new Error("This booking is unavailable.");
      if (previous.exists()) {
        if (previous.data().senderId !== uid || previous.data().text !== text)
          throw new Error(
            "Your earlier message may already be saved. Reopen the conversation before sending different text.",
          );
        return; // Retries never duplicate a successfully committed message.
      }
      const b = booking.data();
      if (b.status !== "confirmed")
        throw new Error(
          "Messages open after confirmation and close when the booking ends.",
        );
      tx.set(ref, {
        senderId: uid,
        senderRole:
          uid === b.studentId
            ? "student"
            : uid === b.mentorUid
              ? "mentor"
              : "coordinator",
        text,
        createdAt: serverTimestamp(),
      });
    }),
    "mentoring/send-timeout",
    15000,
  );
}
