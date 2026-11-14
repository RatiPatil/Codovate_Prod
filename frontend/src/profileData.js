import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { normalizeStudyField } from "./studyFields";
export async function saveProfileDetails(user, data, mobilePrivacy, interests) {
  await runTransaction(db, async (transaction) => {
    const profileRef = doc(db, "users", user.uid);
    const memberRef = doc(db, "memberProfiles", user.uid);
    const current = await transaction.get(profileRef);
    const publicCard = await transaction.get(memberRef);
    const preferencesRef = doc(db, "discoveryPreferences", user.uid);
    const preferences = await transaction.get(preferencesRef);
    if (!current.exists())
      throw new Error("Your profile is unavailable. Please retry.");
    const details =
      preferences.exists() && preferences.data().details
        ? {
            ...preferences.data().details,
            desiredRole: data.careerPreferences.desiredRole,
            domain: data.careerPreferences.domain,
            experience: data.careerPreferences.experience,
            college: data.college,
            degree: data.degree,
            fieldOfStudy: normalizeStudyField(
              current.data().program || data.degree,
            ),
            year: data.careerPreferences.yearOfStudy,
            location: data.city,
            seeking: data.careerPreferences.seeking,
            ...interests,
          }
        : null;
    const sharedInterests =
      publicCard.exists() &&
      details &&
      preferences.data().shareDetails === true;
    if (details)
      transaction.update(preferencesRef, {
        details,
        updatedAt: serverTimestamp(),
      });
    if (publicCard.exists())
      transaction.update(memberRef, {
        ...(sharedInterests ? { details } : {}),
        uid: user.uid,
        name: data.name,
        skills: data.skills,
        updatedAt: serverTimestamp(),
      });
    transaction.update(profileRef, {
      ...data,
      teammateCard: {
        photoUrl: current.data().teammateCard?.photoUrl || "",
        ...interests,
      },
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(db, "mobileSharing", user.uid), {
      uid: user.uid,
      mobile: mobilePrivacy.mobile,
      visibility: mobilePrivacy.visibility,
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(db, "adminUsers", user.uid), {
      uid: user.uid,
      fullName: data.name,
      joinedAt: current.data().createdAt,
      updatedAt: serverTimestamp(),
    });
  });
}
