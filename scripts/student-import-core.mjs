import { createHash, randomBytes } from "node:crypto";
export const branchSkills = {
  "CIVIL ENGINEERING": [
    "Engineering drawing",
    "Surveying",
    "Construction materials",
    "Structural fundamentals",
    "Quantity estimation",
  ],
  "CIVIL STRUCTURE": [
    "Structural analysis",
    "Concrete design fundamentals",
    "Steel design fundamentals",
    "Engineering drawing",
  ],
  "COMPUTER SCIENCE AND ENGINEERING": [
    "Programming fundamentals",
    "Data structures",
    "Database fundamentals",
    "Web fundamentals",
    "Version control",
  ],
  "ELECTRICAL ENGINEERING": [
    "Circuit fundamentals",
    "Electrical machines",
    "Power systems fundamentals",
    "Electrical measurements",
  ],
  "ELECTRONICS AND TELECOMMUNICATION ENGINEERING": [
    "Circuit fundamentals",
    "Digital electronics",
    "Signals and systems",
    "Communication fundamentals",
    "Embedded systems fundamentals",
  ],
  "MECHANICAL ENGINEERING": [
    "Engineering drawing",
    "Mechanics fundamentals",
    "Thermodynamics",
    "Manufacturing fundamentals",
    "CAD fundamentals",
  ],
  "MASTER OF BUSINESS ADMINISTRATION": [
    "Business communication",
    "Management fundamentals",
    "Market research fundamentals",
    "Spreadsheet fundamentals",
  ],
  "DESIGN ENGINEERING": [
    "Engineering design fundamentals",
    "CAD fundamentals",
    "Prototyping fundamentals",
    "Design documentation",
  ],
};
const clean = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
export function programName(value) {
  const p = clean(value).toUpperCase();
  return p === "ELECTRONICS AND TELECOMMUNICATION ENGG"
    ? "ELECTRONICS AND TELECOMMUNICATION ENGINEERING"
    : p;
}
export function normalizeMobile(value) {
  let s = clean(value)
    .replace(/\.0$/, "")
    .replace(/[\s()+-]/g, "");
  if (s.length === 12 && s.startsWith("91")) s = s.slice(2);
  return /^[6-9]\d{9}$/.test(s) ? "+91" + s : null;
}
export function prepareStudents(matrix) {
  const header = matrix[0]?.map((v) => clean(v).toLowerCase()) || [];
  const index = {
    name: header.indexOf("name"),
    mobile: header.indexOf("mobile no"),
    email: header.indexOf("email address"),
    taluka: header.indexOf("tal"),
    program: header.indexOf("program"),
  };
  if (Object.values(index).some((i) => i < 0))
    throw new Error(
      "Required headers: Name, mobile no, email address, Tal, PROGRAM.",
    );
  const rows = matrix
    .slice(1)
    .map((r, i) => ({ r, row: i + 2 }))
    .filter(({ r }) => r.some((v) => clean(v)));
  const valid = [],
    all = [],
    issues = [];
  for (const { r, row } of rows) {
    const record = {
      row,
      name: clean(r[index.name]),
      email: clean(r[index.email]).toLowerCase(),
      mobile: normalizeMobile(r[index.mobile]),
      taluka: clean(r[index.taluka]),
      program: programName(r[index.program]),
    };
    all.push(record);
    const reasons = [];
    if (
      !record.name ||
      record.name.length > 100 ||
      !/[\p{L}]/u.test(record.name)
    )
      reasons.push("invalid_or_missing_name");
    if (
      record.email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)
    )
      reasons.push("invalid_or_missing_email");
    if (!record.mobile) reasons.push("invalid_or_missing_mobile");
    if (record.taluka.length > 100) reasons.push("taluka_too_long");
    if (!branchSkills[record.program]) reasons.push("unmapped_program");
    if (reasons.length) issues.push({ row, code: "validation", reasons });
    else valid.push(record);
  }
  const emailGroups = new Map(),
    mobileGroups = new Map();
  for (const r of all) {
    for (const [map, key] of [
      [
        emailGroups,
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) ? r.email : null,
      ],
      [mobileGroups, r.mobile],
    ]) {
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
  }
  const identity = (r) =>
    JSON.stringify([r.name, r.email, r.mobile, r.taluka, r.program]);
  const conflict = new Set();
  for (const group of [...emailGroups.values(), ...mobileGroups.values()])
    if (new Set(group.map(identity)).size > 1)
      for (const r of group) conflict.add(r.row);
  const seen = new Set(),
    eligible = [];
  for (const r of valid) {
    if (conflict.has(r.row)) {
      issues.push({ row: r.row, code: "contact_conflict" });
      continue;
    }
    const key = identity(r);
    if (seen.has(key)) {
      issues.push({ row: r.row, code: "exact_duplicate" });
      continue;
    }
    seen.add(key);
    eligible.push(r);
  }
  return {
    eligible,
    issues,
    summary: {
      inputRows: rows.length,
      eligible: eligible.length,
      validationRejected: issues.filter((r) => r.code === "validation").length,
      contactConflictRows: issues.filter((r) => r.code === "contact_conflict")
        .length,
      exactDuplicateRows: issues.filter((r) => r.code === "exact_duplicate")
        .length,
    },
  };
}
export const importedUid = (email) =>
  "import_" + createHash("sha256").update(email).digest("hex").slice(0, 40);
export function privateProfile(r, timestamp) {
  return {
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    taluka: r.taluka,
    program: r.program,
    college: "",
    degree: "",
    graduationYear: "",
    city: "",
    bio: "",
    skills: [],
    suggestedSkills: branchSkills[r.program],
    skillSuggestionsSource: "program_defaults_v1",
    portfolio: "",
    resumePath: "",
    resumeUrl: "",
    discoveryEnabled: false,
    accountStatus: "invited",
    mobileVerified: false,
    importSource: "student_workbook_v1",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
export async function importStudent(r, { auth, db, timestamp }) {
  const uid = importedUid(r.email),
    ref = db.doc("users/" + uid);
  let user,
    created = false;
  try {
    user = await auth.getUserByEmail(r.email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
  }
  if (user && user.uid !== uid) return { status: "existing" };
  if (user && (user.disabled || user.customClaims?.admin))
    return { status: "conflict" };
  // Do not claim a phone for authentication until its owner verifies it.
  try {
    const phoneOwner = await auth.getUserByPhoneNumber(r.mobile);
    if (phoneOwner.uid !== uid) return { status: "conflict" };
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
  }
  const old = await ref.get();
  if (old.exists) return { status: user ? "existing" : "conflict" };
  if (!user) {
    await auth.createUser({
      uid,
      email: r.email,
      emailVerified: false,
      displayName: r.name,
      password: randomBytes(32).toString("base64url"),
    });
    created = true;
  }
  try {
    await ref.create(privateProfile(r, timestamp()));
    return { status: created ? "created" : "recovered" };
  } catch (e) {
    if (created) return { status: "partial", code: "profile_write_failed" };
    throw e;
  }
}
