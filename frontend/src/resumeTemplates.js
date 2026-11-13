export const documentResumeTemplates = [
  {
    id: "bullet",
    name: "Bullet-point résumé",
    description: "Present your work with clear, outcome-focused bullet points.",
    audience: "All career stages",
    fileType: "DOC",
    driveId: "142MZDqn1VVT9l10H8bDcKDWClTRXfE2_",
    layout: "student",
  },
  {
    id: "program-manager",
    name: "Technical Program Manager",
    description:
      "Highlight technical delivery, cross-team coordination and measurable impact.",
    audience: "Experienced professionals",
    fileType: "DOCX",
    driveId: "1kbHk20j4oYqX45Ttd3LAHfOAXFzd_a-_",
    layout: "experience",
  },
  {
    id: "student-two",
    name: "Student résumé",
    description:
      "Build around your education, projects, skills and campus achievements.",
    audience: "Students & graduates",
    fileType: "DOCX",
    driveId: "15qsC15KQv2ewl7u1LigBHn196w1q99uC",
    layout: "student",
  },
  {
    id: "experienced-v1",
    name: "Experienced hire · Professional",
    description:
      "Lead with work experience and your most relevant accomplishments.",
    audience: "Experienced professionals",
    fileType: "DOC",
    driveId: "1L3teTscGyGOMoYZfd7ves6dSiq7pbXdX",
    layout: "experience",
  },
  {
    id: "experienced-two",
    name: "Experienced hire · Career highlights",
    description:
      "Organize your career history, capabilities and achievements clearly.",
    audience: "Experienced professionals",
    fileType: "DOCX",
    driveId: "1x2xH-CpZKDEtGVEPWemChwMWpyKHaapu",
    layout: "experience",
  },
  {
    id: "data-scientist",
    name: "Entry-level Data Scientist",
    description:
      "Showcase analytical skills, data projects and practical results.",
    audience: "Students & graduates",
    fileType: "DOCX",
    driveId: "1Ju1JAiADkVH-5VwzDUeySP5FpwaKK8HG",
    layout: "technical",
  },
  {
    id: "classic",
    name: "Classic résumé",
    description:
      "A straightforward structure for education, experience and skills.",
    audience: "All career stages",
    fileType: "DOCX",
    driveId: "1VIsizmysROlu3PmKnGjFUz2IAzSj0DPN",
    layout: "student",
  },
  {
    id: "project-focused",
    name: "Project-focused résumé",
    description:
      "Use the supplied Aditya Srikar résumé as a reference for your own document.",
    audience: "Students & graduates",
    fileType: "DOCX",
    driveId: "17k3KZ8JgrK9g9bnRfgfV98Fnt8_j0s5C",
    layout: "technical",
  },
];
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
  ...documentResumeTemplates,
];
export function originalResumeUrl(template, download = false) {
  return download
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(template.driveId)}`
    : `https://drive.google.com/file/d/${encodeURIComponent(template.driveId)}/view`;
}
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
    achievements: (profile.teammateCard?.achievements || []).join("\n"),
    certifications: "",
    portfolio: profile.portfolio || "",
  };
}
export function resumeHtml(data, template = "student", editable = true) {
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
  const selected = resumeTemplates.find((t) => t.id === template);
  const order = [...orders[selected.layout || template], "certifications"];
  const titles = {
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    experience: "Experience",
    achievements: "Achievements & leadership",
    certifications: "Certifications",
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text("name")} — Résumé</title><style>body{font:11pt/1.5 Arial,sans-serif;color:#202331;max-width:760px;margin:32px auto;padding:0 24px}h1{font-size:24pt;margin:0}h2{font-size:12pt;border-bottom:1px solid #999;padding-bottom:4px;margin-top:22px}p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}section{break-inside:avoid}.instructions{font-size:10pt;padding:12px;background:#f8f9fc}@page{size:A4;margin:16mm}@media print{body{margin:0;padding:0;max-width:none}.instructions{display:none}}</style></head><body><aside class="instructions">${editable ? "Editable résumé: click text to correct it." : "Résumé preview."} Use your browser’s Print → Save as PDF to export. Review page breaks and remove unused sections before submitting.</aside><main contenteditable="${editable ? "true" : "false"}"><h1>${text("name") || "Your name"}</h1><p>${[
    "email",
    "phone",
    "city",
    "portfolio",
  ]
    .map((k) => text(k))
    .filter(Boolean)
    .join(
      " · ",
    )}</p>${section("summary", "Profile")}${order.map((k) => section(k, titles[k])).join("")}</main></body></html>`;
}
