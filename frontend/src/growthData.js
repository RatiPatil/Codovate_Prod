import {
  collection,
  doc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { httpsLink } from "./communityData";
export const mentorTopics = [
  "Interview practice",
  "Career direction",
  "Resume review",
  "Project feedback",
  "Team & hackathon guidance",
  "Portfolio walkthrough",
];
export const updateCategories = [
  "Platform news",
  "Opportunities",
  "Learning",
  "Community",
];
export function sessionInput(raw, now = Date.now()) {
  const title = String(raw.title || "").trim(),
    mentorName = String(raw.mentorName || "").trim(),
    description = String(raw.description || "").trim(),
    location = String(raw.location || "").trim();
  const time = Date.parse(raw.startsAt),
    durationMinutes = Number(raw.durationMinutes);
  if (
    !title ||
    title.length > 120 ||
    !mentorName ||
    mentorName.length > 100 ||
    !description ||
    description.length > 2000
  )
    throw new Error(
      "Complete the title, mentor name and description within the displayed limits.",
    );
  if (
    !mentorTopics.includes(raw.topic) ||
    !["Online", "In person"].includes(raw.format) ||
    !["draft", "published"].includes(raw.status)
  )
    throw new Error("Choose a topic, format and publication state.");
  if (
    !Number.isFinite(time) ||
    time <= now ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 120
  )
    throw new Error(
      "Choose a future start time and a duration from 15 to 120 minutes.",
    );
  if (location.length > 180 || (raw.format === "In person" && !location))
    throw new Error("Add the meeting location in up to 180 characters.");
  const details = {};
  for (const [key, max] of [
    ["mentorRole", 100],
    ["mentorBio", 500],
    ["outcome", 300],
    ["preparation", 300],
    ["mentorUid", 128],
  ]) {
    const value = String(raw[key] || "").trim();
    if (value.length > max)
      throw new Error(`${key} exceeds ${max} characters.`);
    if (value) details[key] = value;
  }
  const expertise = String(raw.expertise || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    expertise.length > 6 ||
    new Set(expertise).size !== expertise.length ||
    expertise.some((s) => s.length > 60 || /[\r\n]/.test(s))
  )
    throw new Error(
      "Add up to six different expertise labels, each 60 characters or fewer.",
    );
  if (expertise.length) details.expertise = expertise;
  if (raw.mentoringVersion === 2) {
    details.mentoringVersion = 2;
    if (
      raw.status === "published" &&
      (!details.mentorUid ||
        !details.mentorRole ||
        !details.mentorBio ||
        !details.outcome ||
        !expertise.length)
    )
      throw new Error(
        "Add a real mentor account, specialization, biography, expertise and expected outcome before publishing.",
      );
  }
  return {
    ...details,
    title,
    mentorName,
    topic: raw.topic,
    description,
    format: raw.format,
    location:
      raw.format === "Online"
        ? "Online — link shared after confirmation"
        : location,
    durationMinutes,
    startsAt: Timestamp.fromMillis(time),
    status: raw.status,
  };
}
export function announcementInput(raw) {
  const title = String(raw.title || "").trim(),
    body = String(raw.body || "").trim();
  if (
    !title ||
    title.length > 120 ||
    !body ||
    body.length > 3000 ||
    !updateCategories.includes(raw.category) ||
    !["draft", "published"].includes(raw.status)
  )
    throw new Error(
      "Complete the announcement title, message, category and visibility.",
    );
  return {
    title,
    body,
    category: raw.category,
    status: raw.status,
    link: httpsLink(raw.link),
  };
}
export async function publishSession(uid, raw) {
  await setDoc(doc(collection(db, "mentorSessions")), {
    ...sessionInput({ ...raw, mentoringVersion: 2 }),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function sessionStatus(id, status) {
  if (!["draft", "published", "closed"].includes(status))
    throw new Error("Invalid session status.");
  await updateDoc(doc(db, "mentorSessions", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}
export async function saveAnnouncement(uid, raw, id) {
  const value = { ...announcementInput(raw), updatedAt: serverTimestamp() };
  if (id) return updateDoc(doc(db, "announcements", id), value);
  await setDoc(doc(collection(db, "announcements")), {
    ...value,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
}
export async function requestMentoring(user, profile, sessionId, note) {
  const text = note.trim();
  if (!profile?.name?.trim())
    throw new Error("Add your name in your profile first.");
  if (!text || text.length > 1000)
    throw new Error(
      "Describe what you want help with in up to 1,000 characters.",
    );
  const target = doc(db, "mentorBookings", user.uid + "_" + sessionId);
  await runTransaction(db, async (tx) => {
    const [old, session] = await Promise.all([
      tx.get(target),
      tx.get(doc(db, "mentorSessions", sessionId)),
    ]);
    if (old.exists())
      throw new Error("You already requested this session. Check My bookings.");
    if (
      !session.exists() ||
      session.data().status !== "published" ||
      session.data().startsAt.toMillis() <= Date.now()
    )
      throw new Error("This session is no longer accepting requests.");
    const s = session.data();
    tx.set(target, {
      studentId: user.uid,
      studentName: profile.name,
      ...(s.mentorUid ? { mentorUid: s.mentorUid } : {}),
      sessionId,
      sessionTitle: s.title,
      mentorName: s.mentorName,
      startsAt: s.startsAt,
      durationMinutes: s.durationMinutes,
      format: s.format,
      location: s.location,
      note: text,
      status: "pending",
      meetingUrl: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
export const bookingTransitions = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "cancelled"],
  declined: [],
  cancelled: [],
  completed: [],
};
export async function changeBooking(id, status, meetingUrl, adminUid) {
  await runTransaction(db, async (tx) => {
    const target = doc(db, "mentorBookings", id),
      snapshot = await tx.get(target);
    if (
      !snapshot.exists() ||
      !bookingTransitions[snapshot.data().status]?.includes(status)
    )
      throw new Error("This booking has changed. Refresh before trying again.");
    const booking = snapshot.data();
    if (status === "confirmed" && booking.startsAt.toMillis() <= Date.now())
      throw new Error("This session has already started.");
    if (
      status === "completed" &&
      booking.startsAt.toMillis() + booking.durationMinutes * 60000 > Date.now()
    )
      throw new Error(
        "Wait until the session has ended before marking it completed.",
      );
    const changes = { status, updatedAt: serverTimestamp() };
    if (meetingUrl !== undefined) {
      changes.meetingUrl = httpsLink(meetingUrl);
      if (
        status === "confirmed" &&
        snapshot.data().format === "Online" &&
        !changes.meetingUrl
      )
        throw new Error(
          "Add an HTTPS meeting link before confirming an online session.",
        );
    }
    tx.update(target, changes);
    if (adminUid)
      tx.set(doc(collection(db, "notifications")), {
        studentId: booking.studentId,
        title: "Mentoring booking update",
        body: booking.sessionTitle + ": your request is now " + status + ".",
        link: "/mentoring",
        read: false,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
}
function foldCalendarLine(value) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = "";
  for (const character of value) {
    if (encoder.encode(current + character).length > 75) {
      lines.push(current);
      current = " " + character;
    } else current += character;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function calendarEvent(item) {
  const start = item.startsAt?.toMillis?.();
  if (!Number.isFinite(start))
    throw new Error("The session date is unavailable.");
  const utc = (n) =>
    new Date(n)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const escape = (value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Codovate//Mentoring//EN",
    "BEGIN:VEVENT",
    "UID:" + escape(item.id) + "@codovate",
    "DTSTAMP:" + utc(Date.now()),
    "DTSTART:" + utc(start),
    "DTEND:" + utc(start + item.durationMinutes * 60000),
    "SUMMARY:" + escape(item.sessionTitle || item.title),
    "LOCATION:" + escape(item.meetingUrl || item.location),
    "DESCRIPTION:" + escape("Mentoring with " + item.mentorName),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(foldCalendarLine)
    .join("\r\n");
}

// Revocation changes the parent booking, so workspace and message rules revoke
// the mentor's access immediately without copying membership into child docs.
export async function revokeBookingMentor(id) {
  await updateDoc(doc(db, "mentorBookings", id), {
    mentorUid: "",
    updatedAt: serverTimestamp(),
  });
}
