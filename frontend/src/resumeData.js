import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { httpsLink } from "./communityData";
import { withTimeout } from "./authSupport";
export async function validateResumePdf(file) {
  if (
    !file ||
    file.size === 0 ||
    file.size > 5 * 1024 * 1024 ||
    !/\.pdf$/i.test(file.name) ||
    (file.type && file.type !== "application/pdf")
  )
    throw new Error("Choose a nonempty PDF résumé of 5 MB or less.");
  const header = await file.slice(0, 5).text();
  if (header !== "%PDF-")
    throw new Error(
      "This file is not a valid PDF. Export your résumé as a PDF and try again.",
    );
}
export function resumeError(error) {
  if (error.code?.startsWith("storage/"))
    return "PDF upload failed. Check your connection and try again. If it continues, save an HTTPS résumé link below; file uploads require Firebase Storage to be configured and accessible.";
  if (error.code === "resume/upload-timeout")
    return "The upload timed out. Your selected file is still here; retry or save an HTTPS résumé link.";
  if (
    error.code === "permission-denied" ||
    error.code === "firestore/permission-denied"
  )
    return "Your résumé could not be saved. Sign in again and retry. The latest Firestore rules must be deployed.";
  return error.code
    ? "Your résumé was not confirmed as saved. Check your connection and retry."
    : error.message;
}
export async function saveResume(
  uid,
  { mode, file, url },
  onProgress = () => {},
) {
  if (!uid || !db)
    throw new Error("Sign in and connect Firebase before saving your résumé.");
  let changes;
  if (mode === "pdf") {
    await validateResumePdf(file);
    if (!storage)
      throw new Error(
        "File storage is unavailable. You can save an HTTPS résumé link instead.",
      );
    const path = `resumes/${uid}/resume.pdf`;
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: "application/pdf",
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          Object.assign(new Error("Upload timed out"), {
            code: "resume/upload-timeout",
          }),
        );
        task.cancel();
      }, 60000);
      task.on(
        "state_changed",
        (snapshot) =>
          onProgress(
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          ),
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
        () => {
          clearTimeout(timer);
          resolve();
        },
      );
    });
    changes = { resumePath: path, resumeUrl: "" };
  } else if (mode === "link") changes = { resumeUrl: httpsLink(url, true) };
  else throw new Error("Choose a PDF upload or résumé link.");
  await withTimeout(
    runTransaction(db, async (tx) => {
      const target = doc(db, "users", uid),
        current = await tx.get(target);
      if (!current.exists())
        throw new Error(
          "Your profile is unavailable. Reload My profile and retry.",
        );
      tx.update(target, { ...changes, updatedAt: serverTimestamp() });
    }),
    "resume/save-timeout",
    15000,
  );
  return changes;
}
export async function resumeDownloadUrl(profile) {
  if (profile?.resumeUrl) return httpsLink(profile.resumeUrl, true);
  if (!profile?.resumePath || !storage)
    throw new Error(
      "No saved PDF is available. Upload a PDF or save a résumé link first.",
    );
  return withTimeout(
    getDownloadURL(ref(storage, profile.resumePath)),
    "resume/open-timeout",
    15000,
  );
}
