import { expect, it, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  records: [],
  save: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}),
  doc: (_db, ...path) => path.join("/"),
  onSnapshot: (_ref, next) => {
    next({ docs: state.records.map((data) => ({ data: () => data })) });
    return () => {};
  },
  setDoc: state.save,
}));
import { approvedStudyFields, StudyFieldAdmin } from "./StudyFieldAdmin";
afterEach(() => {
  cleanup();
  state.records = [];
  state.save.mockClear();
});
it("accepts only curated fields, with admin overrides for removal and approval", () => {
  const fields = approvedStudyFields([
    { code: "CIVIL ENGINEERING", enabled: false },
    { code: "BIOTECHNOLOGY", enabled: true },
  ]);
  expect(fields).not.toContain("CIVIL ENGINEERING");
  expect(fields).toContain("BIOTECHNOLOGY");
  expect(fields).not.toContain("GFHFGHFGH");
  expect(fields).not.toContain("YY");
});
it("lets admins approve full academic names and remove choices", async () => {
  render(<StudyFieldAdmin />);
  fireEvent.change(screen.getByLabelText("Full field of study name"), {
    target: { value: "Biotechnology" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add approved field" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith("studyFields/BIOTECHNOLOGY", {
      code: "BIOTECHNOLOGY",
      enabled: true,
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Add approved field" }).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
  await waitFor(() =>
    expect(state.save).toHaveBeenLastCalledWith(expect.any(String), {
      code: expect.any(String),
      enabled: false,
    }),
  );
});
