import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
const state = vi.hoisted(() => ({
  session: {},
  save: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("./session", () => ({ useSession: () => state.session }));
vi.mock("./onboardingData", async (importOriginal) => ({
  ...(await importOriginal()),
  saveOnboarding: state.save,
  loadOnboardingCard: vi.fn().mockResolvedValue(null),
}));
import { Onboarding, OnboardingGate, saveFailureMessage } from "./Onboarding";
import { initialOnboarding } from "./onboardingContract";
beforeEach(() => {
  vi.clearAllMocks();
  state.save.mockResolvedValue();
  state.session = {
    user: { uid: "student", displayName: "vivek ashok chavan" },
    profile: {
      name: "vivek ashok chavan",
      mobile: "+919876543210",
      city: "Pune",
      college: "Regional College",
      degree: "MCA",
      program: "Computer Science",
      graduationYear: "2027",
      bio: "I enjoy building accessible applications.",
      skills: ["React"],
      careerPreferences: {
        yearOfStudy: "Final year",
        desiredRole: "Frontend Developer",
        domain: "Web Development",
        goals: ["Internships"],
        seeking: ["Project Collaborators"],
      },
      onboarding: initialOnboarding("created"),
    },
    loading: false,
    logout: state.logout,
  };
});
afterEach(cleanup);
function open(path = "/onboarding") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OnboardingGate>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<p>Workspace ready</p>} />
          <Route path="/profile" element={<p>Profile ready</p>} />
          <Route path="/login" element={<p>Sign-in flow active</p>} />
          <Route path="/signup" element={<p>Sign-in flow active</p>} />
          <Route path="/phone-login" element={<p>Sign-in flow active</p>} />
        </Routes>
      </OnboardingGate>
    </MemoryRouter>,
  );
}
it("routes an unfinished account to onboarding before profile or public return destinations", async () => {
  open("/profile");
  fireEvent.click(
    await screen.findByRole("button", { name: "Let’s build my profile" }),
  );
  expect(
    await screen.findByRole("heading", { name: "About you" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Profile ready")).toBeNull();
});
it.each([{ version: 1, status: "completed", step: 4 }])(
  "does not repeat onboarding for completed accounts",
  async (onboarding) => {
    state.session.profile.onboarding = onboarding;
    open("/profile");
    expect(await screen.findByText("Profile ready")).toBeInTheDocument();
  },
);
it("prefills the name and shows its uppercase profile preview", () => {
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Let’s build my profile" }),
  );
  expect(screen.getByLabelText("First name")).toHaveValue("VIVEK");
  expect(screen.getByLabelText("Middle name")).toHaveValue("ASHOK");
  expect(screen.getByLabelText("Last name")).toHaveValue("CHAVAN");
  expect(
    screen.queryByRole("complementary", {
      name: "Live student profile preview",
    }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Preview profile" }));
  expect(
    screen.getByRole("heading", { name: "VIVEK ASHOK CHAVAN" }),
  ).toBeInTheDocument();
});
it("resumes the saved education step and keeps users on the step when saving fails", async () => {
  state.session.profile.onboarding.step = 2;
  state.save.mockRejectedValue(new Error("Please retry saving."));
  open();
  expect(
    screen.getByRole("heading", { name: "Education" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Save and continue/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please retry saving.",
  );
  expect(
    screen.getByRole("heading", { name: "Education" }),
  ).toBeInTheDocument();
});
it("keeps discovery opt-in off and waits for persisted completion", async () => {
  state.session.profile.onboarding.step = 4;
  open();
  const checkbox = screen.getByRole("checkbox", {
    name: /Make my name and skills discoverable/,
  });
  expect(checkbox).not.toBeChecked();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Complete setup/ }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Complete setup/ }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith(
      state.session.user,
      expect.any(Object),
      4,
      {
        complete: true,
        partial: false,
        discoverable: false,
        shareDetails: false,
      },
    ),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Preparing your welcome",
  );
  expect(screen.queryByText("Workspace ready")).toBeNull();
});

it("greets new students with a welcome illustration before collecting details", () => {
  open();
  expect(
    screen.getByRole("heading", { name: /Welcome, VIVEK/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /illustrated student profile/ }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("First name")).toBeNull();
});

it("reveals the celebration only after a successful save and completed profile snapshot", async () => {
  state.session.profile.onboarding.step = 4;
  const view = open();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Complete setup/ }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Complete setup/ }));
  await screen.findByRole("status");
  expect(
    screen.queryByRole("heading", { name: "Your next chapter is ready." }),
  ).toBeNull();
  state.session = {
    ...state.session,
    profile: {
      ...state.session.profile,
      onboarding: { status: "completed", step: 4 },
    },
  };
  view.rerender(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <OnboardingGate>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<p>Workspace ready</p>} />
        </Routes>
      </OnboardingGate>
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("heading", { name: "Your next chapter is ready." }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Enter my workspace/ }),
  ).toHaveAttribute("href", "/dashboard");
});

it("requires existing registered users without a marker to finish onboarding and prefills their profile", () => {
  state.session.profile = {
    name: "Existing Student",
    city: "Pune",
    college: "Regional College",
    skills: ["React"],
  };
  open("/profile");
  fireEvent.click(
    screen.getByRole("button", { name: "Let’s build my profile" }),
  );
  expect(screen.getByLabelText("First name")).toHaveValue("EXISTING");
  expect(screen.getByLabelText("Middle name")).toHaveValue("");
  expect(screen.getByLabelText("Last name")).toHaveValue("STUDENT");
  expect(screen.getByLabelText("City", { exact: true })).toHaveValue("Pune");
  expect(screen.queryByText("Profile ready")).toBeNull();
});

it("blocks invalid city and short mobile inline before any save", async () => {
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Let’s build my profile" }),
  );
  fireEvent.change(screen.getByLabelText("City", { exact: true }), {
    target: { value: "Pune123" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Mobile number", exact: true }),
    { target: { value: "98765" } },
  );
  fireEvent.click(screen.getByRole("button", { name: /Save and continue/ }));
  expect(state.save).not.toHaveBeenCalled();
  expect(screen.getByText(/Numbers are not allowed/)).toBeInTheDocument();
  expect(screen.getByText(/10-digit Indian mobile/)).toBeInTheDocument();
  expect(screen.getByLabelText(/^City/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

it("keeps the card closed until requested and can close it again", () => {
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Let’s build my profile" }),
  );
  expect(screen.queryByRole("complementary")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Preview profile" }));
  expect(screen.getByRole("complementary")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Hide preview" }));
  expect(screen.queryByRole("complementary")).toBeNull();
});
it("gives a permission-specific support code without deployment instructions in the product", () => {
  expect(saveFailureMessage("permission-denied")).toContain("PROFILE_ACCESS");
  expect(saveFailureMessage("permission-denied")).not.toContain("rules");
  expect(saveFailureMessage("unavailable")).toContain("connection");
});

it.each(["/login", "/signup", "/phone-login"])(
  "lets %s finish authentication before onboarding redirects",
  async (path) => {
    open(path);
    expect(await screen.findByText("Sign-in flow active")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Let’s build my profile" }),
    ).toBeNull();
  },
);

it("includes the denied operation in the support code without exposing user data", () => {
  expect(saveFailureMessage("permission-denied", "READ_DIRECTORY")).toContain(
    "PROFILE_ACCESS_READ_DIRECTORY",
  );
  expect(saveFailureMessage("permission-denied", "WRITE_PROFILE")).toContain(
    "PROFILE_ACCESS_WRITE_PROFILE",
  );
});

it("adds teammate details to onboarding and requires explicit expanded sharing", async () => {
  state.session.profile.onboarding.step = 3;
  open();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Save and continue/ }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByText("Your teammate card: photo, achievements & interests"),
  );
  fireEvent.change(screen.getByLabelText("Achievements"), {
    target: { value: "SIH Participant" },
  });
  fireEvent.click(screen.getByLabelText("Open Source", { exact: true }));
  fireEvent.click(screen.getByRole("button", { name: /Save and continue/ }));
  await screen.findByRole("heading", { name: "Collaboration", exact: true });
  const sharing = screen.getByRole("checkbox", { name: /Also share my role/ });
  expect(sharing).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /Make my name and skills discoverable/,
    }),
  );
  fireEvent.click(sharing);
  fireEvent.click(screen.getByRole("button", { name: /Complete setup/ }));
  await waitFor(() =>
    expect(state.save).toHaveBeenLastCalledWith(
      state.session.user,
      expect.objectContaining({
        achievementsText: "SIH Participant",
        passions: ["Open Source"],
      }),
      4,
      expect.objectContaining({ discoverable: true, shareDetails: true }),
    ),
  );
});
