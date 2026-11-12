import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
export const TYPING_VISIBLE_MS = 6000;
export async function setChatTyping(roomId, uid, active) {
  await setDoc(doc(db, "conversations", roomId, "typing", uid), {
    uid,
    active: !!active,
    updatedAt: serverTimestamp(),
  });
}
export async function markChatRead(roomId, uid, lastMessageId) {
  if (!lastMessageId) return;
  await setDoc(doc(db, "conversations", roomId, "readReceipts", uid), {
    uid,
    lastMessageId,
    lastReadAt: serverTimestamp(),
  });
}
export function messageReadCount(message, receipts, participants, uid) {
  const sentAt = message.createdAt?.toMillis?.();
  if (!sentAt || message.pending) return 0;
  return receipts.filter(
    (receipt) =>
      receipt.uid !== uid &&
      participants.includes(receipt.uid) &&
      (receipt.lastReadAt?.toMillis?.() || 0) >= sentAt,
  ).length;
}
