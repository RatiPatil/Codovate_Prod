import { beforeEach, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), set: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_, c, id) => `${c}/${id}`,
  serverTimestamp: () => "SERVER",
  runTransaction: (_, fn) => fn(m),
}));
import { saveProfileDetails } from "./profileData";
const details = {
  desiredRole: "Old",
  domain: "Research",
  experience: "Beginner",
  college: "Old",
  degree: "MCA",
  fieldOfStudy: "MASTER OF COMPUTER APPLICATIONS",
  year: "First year",
  location: "Old",
  photoUrl: "",
  achievements: [],
  seeking: [],
  passions: [],
};
const data = {
  name: "STUDENT MIDDLE PATIL",
  skills: ["React"],
  college: "New College",
  degree: "MCA",
  city: "Pune",
  careerPreferences: {
    desiredRole: "Developer",
    domain: "Web Development",
    experience: "Intermediate",
    yearOfStudy: "Second year",
    seeking: ["Project Collaborators"],
  },
};
let sharing;
beforeEach(() => {
  vi.clearAllMocks();
  sharing = true;
  m.get.mockImplementation(async (ref) => ({
    exists: () => true,
    data: () =>
      ref.startsWith("users")
        ? {
            program: "MASTER OF COMPUTER APPLICATIONS",
            createdAt: "ORIGINAL",
            teammateCard: { photoUrl: "" },
          }
        : ref.startsWith("discoveryPreferences")
          ? { shareDetails: sharing, details }
          : { details },
  }));
});
it("synchronizes opted-in academic and interest details in the same transaction", async () => {
  await saveProfileDetails(
    { uid: "alice" },
    data,
    { mobile: "+919999999999", visibility: "only_me" },
    { achievements: ["Participant"], passions: ["Open Source"] },
  );
  const updates = Object.fromEntries(m.update.mock.calls);
  expect(updates["memberProfiles/alice"].details).toMatchObject({
    college: "New College",
    location: "Pune",
    desiredRole: "Developer",
    experience: "Intermediate",
    passions: ["Open Source"],
  });
  expect(updates["discoveryPreferences/alice"].details).toEqual(
    updates["memberProfiles/alice"].details,
  );
  expect(updates["users/alice"]).not.toHaveProperty("resumePath");
  expect(m.set).toHaveBeenCalledWith(
    "mobileSharing/alice",
    expect.objectContaining({ visibility: "only_me" }),
  );
});
it("does not publish private career details when sharing is off", async () => {
  sharing = false;
  await saveProfileDetails(
    { uid: "alice" },
    data,
    { mobile: "+919999999999", visibility: "none" },
    { achievements: [], passions: [] },
  );
  const updates = Object.fromEntries(m.update.mock.calls);
  expect(updates["memberProfiles/alice"]).not.toHaveProperty("details");
  expect(updates["discoveryPreferences/alice"].details.location).toBe("Pune");
});
