export const resumeTemplates = [
  {
    id: "student",
    name: "Student essentials",
    description: "Education, skills and projects first.",
  },
  {
    id: "technical",
    name: "Technical projects",
    description: "Lead with your projects and practical skills.",
  },
  {
    id: "experience",
    name: "Experience first",
    description: "Highlight internships and work experience.",
  },
];
export function resumeFromProfile(profile = {}, email = "") {
  profile ||= {};
  return {
    name: profile.name || "",
    email: profile.email || email,
    phone: "",
    city: profile.city || "",
    education: [profile.college, profile.degree, profile.graduationYear]
      .filter(Boolean)
      .join(" · "),
    skills: (profile.skills || []).join(", "),
    summary: profile.bio || "",
    projects: "",
    experience: "",
    achievements: "",
    portfolio: profile.portfolio || "",
  };
}
export function resumeHtml(data, template = "student") {
  if (!resumeTemplates.some((t) => t.id === template))
    throw new Error("Choose a résumé template.");
  const escape = (value) =>
    String(value || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const text = (key) => escape(data[key]);
  const section = (key, title) =>
    data[key]?.trim()
      ? `<section><h2>${title}</h2><p>${text(key)}</p></section>`
      : "";
  const orders = {
    student: ["education", "skills", "projects", "experience", "achievements"],
    technical: [
      "skills",
      "projects",
      "experience",
      "education",
      "achievements",
    ],
    experience: [
      "experience",
      "projects",
      "skills",
      "education",
      "achievements",
    ],
  };
  const titles = {
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    experience: "Experience",
    achievements: "Achievements",
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text("name")} — Résumé</title><style>body{font:11pt/1.5 Arial,sans-serif;color:#202331;max-width:760px;margin:32px auto;padding:0 24px}h1{font-size:24pt;margin:0}h2{font-size:12pt;border-bottom:1px solid #999;padding-bottom:4px;margin-top:22px}p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}section{break-inside:avoid}.instructions{font-size:10pt;padding:12px;background:#f8f9fc}@page{size:A4;margin:16mm}@media print{body{margin:0;padding:0;max-width:none}.instructions{display:none}}</style></head><body><aside class="instructions">Editable résumé: click text to correct it. Use your browser’s Print → Save as PDF to export. Review page breaks and remove unused sections before submitting.</aside><main contenteditable="true"><h1>${text("name") || "Your name"}</h1><p>${[
    "email",
    "phone",
    "city",
    "portfolio",
  ]
    .map((k) => text(k))
    .filter(Boolean)
    .join(
      " · ",
    )}</p>${section("summary", "Profile")}${orders[template].map((k) => section(k, titles[k])).join("")}</main></body></html>`;
}
