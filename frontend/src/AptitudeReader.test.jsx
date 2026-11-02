import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const fake = vi.hoisted(() => ({ uid: null, read: vi.fn(), write: vi.fn() }));
vi.mock("./session", () => ({
  useSession: () => ({ user: fake.uid ? { uid: fake.uid } : null }),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (...x) => x,
  getDoc: (...x) => fake.read(...x),
  setDoc: (...x) => fake.write(...x),
  serverTimestamp: () => "time",
}));
import { AptitudeReader, LessonText } from "./AptitudeReader";
const lesson = {
  id: "apt-test",
  title: "Percentages",
  body: "## Concept\nUse the original base.\n\n| Part | Share |\n| --- | --- |\n| A | 25% |",
  sourceNote: "Checked adaptation.",
  practice: [
    {
      prompt: "25% of 80?",
      options: ["10", "20", "30", "40"],
      answerIndex: 1,
      explanation: "Divide 80 by 4.",
    },
  ],
};
const show = () =>
  render(
    <MemoryRouter>
      <AptitudeReader lesson={lesson} />
    </MemoryRouter>,
  );
beforeEach(() => {
  fake.uid = null;
  fake.read.mockReset();
  fake.read.mockResolvedValue({ exists: () => false });
  fake.write.mockReset();
  fake.write.mockResolvedValue();
});
afterEach(cleanup);
it("renders safe headings and accessible source tables", () => {
  render(<LessonText body={lesson.body} />);
  expect(screen.getByRole("heading", { name: "Concept" })).toBeTruthy();
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.getByText("25%")).toBeTruthy();
});
it("requires an answer and explains the result without awarding gems", () => {
  show();
  expect(screen.getByRole("button", { name: "Check answers" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText("20"));
  fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
  expect(screen.getByText("Divide 80 by 4.")).toBeTruthy();
  expect(screen.getByText("Practice result: 1 / 1")).toBeTruthy();
  expect(fake.write).not.toHaveBeenCalled();
});
it("stores completion and notes only in the current student record", async () => {
  fake.uid = "alice";
  show();
  await screen.findByRole("button", { name: "Mark lesson complete" });
  fireEvent.change(screen.getByLabelText("Private notes"), {
    target: { value: "Remember the base" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
  await waitFor(() => expect(fake.write).toHaveBeenCalledOnce());
  expect(fake.write.mock.calls[0][0]).toEqual([
    {},
    "placementProgress",
    "alice_apt-test",
  ]);
  expect(fake.write.mock.calls[0][1]).toMatchObject({
    studentId: "alice",
    lessonId: "apt-test",
    note: "Remember the base",
  });
  expect(fake.write.mock.calls[0][1]).not.toHaveProperty("gems");
});
it("blocks writes if existing notes cannot be loaded", async () => {
  fake.uid = "alice";
  fake.read.mockRejectedValue(new Error("network"));
  show();
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Save notes" })).toBeDisabled();
  expect(fake.write).not.toHaveBeenCalled();
});
