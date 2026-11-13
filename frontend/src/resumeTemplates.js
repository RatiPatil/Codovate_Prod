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
export function originalResumeUrl(template, download = false) {
  return download
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(template.driveId)}`
    : `https://drive.google.com/file/d/${encodeURIComponent(template.driveId)}/view`;
}
