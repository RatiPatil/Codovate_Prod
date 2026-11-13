import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const fake = vi.hoisted(() => ({
  admin: false,
  docs: [],
  add: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("./session", () => ({
  useSession: () => ({ user: { uid: "operator" }, admin: fake.admin }),
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: () => "time",
  getDoc: async () => ({exists:()=>false}),
  setDoc: vi.fn(),
  getDocs: async () => ({
    docs: fake.docs.map((d) => ({ id: d.id, data: () => d })),
  }),
  addDoc: (...x) => fake.add(...x),
  updateDoc: (...x) => fake.update(...x),
}));
import { Placement } from "./Placement";
import { sections, placementInput } from "./placementData";
const show = (url = "/placement", manage = false) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Placement manage={manage} />
    </MemoryRouter>,
  );
beforeEach(() => {
  fake.admin = false;
  fake.docs = [];
  fake.add.mockReset();
  fake.update.mockReset();
});
afterEach(cleanup);
it("includes all 24 sections and filters without changing the catalogue", () => {
  show();
  expect(sections).toHaveLength(24);
  expect(new Set(sections.map((s) => s.id)).size).toBe(24);
  for (const s of sections)
    expect(screen.getByRole("heading", { name: s.title })).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "DBMS" },
  });
  expect(screen.getByRole("heading", { name: "DBMS" })).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "HR Interview Questions" }),
  ).toBeNull();
});
it("opens a section with an honest empty state", async () => {
  show();
  fireEvent.click(screen.getByRole("heading", { name: "Aptitude" }));
  expect(await screen.findByText("Material is being prepared")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save content" })).toBeNull();
});
it("opens nested folders and renders article text safely", async () => {
  fake.docs = [
    {
      id: "di",
      sectionId: "aptitude",
      parentId: "",
      kind: "folder",
      title: "Data Interpretation",
      status: "published",
    },
    {
      id: "charts",
      sectionId: "aptitude",
      parentId: "di",
      kind: "article",
      title: "Reading charts",
      body: "<script>unsafe()</script>\nWorked example",
      status: "published",
    },
  ];
  show("/placement?section=aptitude");
  fireEvent.click(await screen.findByRole("button", { name: "Open folder →" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Open article →" }),
  );
  expect(await screen.findByText(/<script>unsafe/)).toBeTruthy();
  expect(document.querySelector("script")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back to topics" }));
  expect(
    await screen.findByRole("button", { name: "Open article →" }),
  ).toBeTruthy();
});
it("admin saves a draft folder with section and parent metadata", async () => {
  fake.admin = true;
  show("/admin?tab=placement&section=aptitude", true);
  await screen.findByText("Material is being prepared");
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Data Interpretation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save content" }));
  await waitFor(() => expect(fake.add).toHaveBeenCalledOnce());
  expect(fake.add.mock.calls[0][1]).toMatchObject({
    sectionId: "aptitude",
    parentId: "",
    kind: "folder",
    status: "draft",
    createdBy: "operator",
  });
});
it("refuses admin content controls for students", () => {
  show("/admin?tab=placement", true);
  expect(screen.getByRole("alert").textContent).toContain(
    "Administrator access required",
  );
});
it("validates publication and source links", () => {
  const base = {
    sectionId: "aptitude",
    parentId: "",
    kind: "article",
    title: "Percentages",
    summary: "",
    body: "",
    sourceUrl: "",
    status: "published",
  };
  expect(() => placementInput(base)).toThrow(/lesson text/);
  expect(() =>
    placementInput({
      ...base,
      body: "Lesson",
      sourceUrl: "javascript:alert(1)",
    }),
  ).toThrow(/HTTPS/);
  expect(() =>
    placementInput({ ...base, kind: "folder", body: "Lesson" }),
  ).toThrow(/Folders/);
  expect(placementInput({ ...base, body: "Lesson" }).body).toBe("Lesson");
});
it("shows the career directory alongside existing published material", async () => {
  fake.docs = [{id: "guide", parentId: "", sectionId: "career-portals", kind: "article", title: "Application checklist", status: "published"}];
  show("/placement?section=career-portals");
  expect(screen.getByRole("heading", { name: "Find your next opportunity directly." })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Application checklist" })).toBeInTheDocument();
  expect(screen.queryByText("Material is being prepared")).toBeNull();
});

it("links the student résumé preparation section to the existing Word template gallery", () => {
 show();
 expect(screen.getByRole("link",{name:/Word templates/})).toHaveAttribute("href","/resume");
});
