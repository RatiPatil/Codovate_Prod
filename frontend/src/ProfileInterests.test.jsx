import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
vi.mock("./firebase", () => ({ db: {} }));
import { ProfileInterests, profileInterests } from "./ProfileInterests";
afterEach(cleanup);
it("loads existing achievements and interests into the profile form", () => {
  render(
    <form aria-label="Profile">
      <ProfileInterests
        profile={{
          teammateCard: {
            achievements: ["SIH Participant"],
            passions: ["Research"],
          },
        }}
      />
    </form>,
  );
  expect(screen.getByLabelText("Your achievements")).toHaveValue(
    "SIH Participant",
  );
  expect(screen.getByLabelText("Research")).toBeChecked();
  fireEvent.click(screen.getByLabelText("Open Source"));
  const values = profileInterests(
    new FormData(screen.getByRole("form", { name: "Profile" })),
  );
  expect(values).toEqual({
    achievements: ["SIH Participant"],
    passions: ["Open Source", "Research"],
  });
});
it("deduplicates tags and rejects invalid or oversized entries", () => {
  const form = new FormData();
  form.set("achievements", "Winner, Winner");
  expect(profileInterests(form).achievements).toEqual(["Winner"]);
  form.append("passions", "Invalid");
  expect(() => profileInterests(form)).toThrow("listed");
  form.delete("passions");
  form.set("achievements", "x".repeat(61));
  expect(() => profileInterests(form)).toThrow("60");
});
