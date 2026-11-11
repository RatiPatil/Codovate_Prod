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
}));
import { Onboarding, OnboardingGate } from "./Onboarding";
import { initialOnboarding } from "./onboardingContract";
beforeEach(() => {
  vi.clearAllMocks();
  state.save.mockResolvedValue();
  state.session = {
    user: { uid: "student", displayName: "vivek chavan" },
    profile: { name: "vivek chavan", onboarding: initialOnboarding("created") },
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
it.each([undefined, { version: 1, status: "completed", step: 4 }])(
  "does not repeat onboarding for legacy or completed accounts",
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
  expect(screen.getByLabelText("Your full name")).toHaveValue("vivek chavan");
  expect(
    screen.getByRole("heading", { name: "VIVEK CHAVAN" }),
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
  fireEvent.click(screen.getByRole("button", { name: /Complete setup/ }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith(
      state.session.user,
      expect.any(Object),
      4,
      { complete: true, partial: false, discoverable: false },
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
  expect(screen.queryByLabelText("Your full name")).toBeNull();
});

it("reveals the celebration only after a successful save and completed profile snapshot", async () => {
  state.session.profile.onboarding.step = 4;
  const view = open();
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
