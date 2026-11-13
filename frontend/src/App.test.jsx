import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import records from "./curatedOpportunities.json";
import { SessionProvider } from "./session";
vi.mock("./firebase", () => ({
  configured: false,
  app: null,
  auth: null,
  db: null,
  storage: null,
}));
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(Date, "now").mockReturnValue(Math.max(...records.map(row=>Date.parse(row.reviewedAt))) + 3600000);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
}
describe("main opportunity catalog without Firebase", () => {
  it("keeps original logo and exposes four opportunity categories", () => {
    renderAt("/");
    expect(screen.getAllByAltText("Codovate")[0]).toHaveAttribute(
      "src",
      "/logo-light.png",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "big move.",
    );
    expect(document.querySelectorAll(".path-card")).toHaveLength(4);
    expect(screen.getByText(/Official listings available/)).toBeInTheDocument();
  });
  it("switches homepage opportunity categories", async () => {
    renderAt("/");
    fireEvent.click(
      screen.getByRole("button", { name: "Jobs", exact: true }),
    );
    await waitFor(() =>
      expect(document.querySelectorAll(".opportunity-card")).toHaveLength(15),
    );
    expect(
      screen.getByRole("link", {
        name: "Software Development Engineer I",
        exact: true,
      }),
    ).toBeInTheDocument();
  });
  it("filters by URL type and search, then opens a listing detail", async () => {
    renderAt("/explore?type=internship");
    expect(document.querySelectorAll(".opportunity-card")).toHaveLength(15);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search by role, skill or company" }),
      { target: { value: "Stripe" } },
    );
    await waitFor(() =>
      expect(document.querySelectorAll(".opportunity-card")).toHaveLength(1),
    );
    fireEvent.click(
      screen.getByRole("link", {
        name: "Software Engineer, Intern",
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Software Engineer, Intern",
      ),
    );
    expect(
      screen.getByRole("link", { name: "Apply on official website" }),
    ).toHaveAttribute("href", expect.stringContaining("stripe.com"));
    expect(screen.queryByText("Real opportunities")).not.toBeInTheDocument();
  });
  it("shows Google sign-in clearly while preventing unconfigured auth requests", () => {
    renderAt("/login");
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeDisabled();
  });
  it("shows precise Firebase status without claiming a live connection", () => {
    renderAt("/setup");
    expect(
      screen.getByRole("button", { name: "Check live Firestore" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Local configuration is not loaded/),
    ).toBeInTheDocument();
    expect(screen.getByText("npm run firebase:setup")).toBeInTheDocument();
  });
  it("protects disconnected student and admin workspaces", () => {
    renderAt("/admin");
    expect(
      screen.getByRole("heading", {
        name: "Connect your new Firebase project",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Publish opportunity" }),
    ).not.toBeInTheDocument();
  });
});
describe("homepage discovery after verified snapshots expire", () => {
  beforeEach(() => {
    vi.mocked(Date.now).mockReturnValue(Date.parse("2026-11-11T12:00:00Z"));
  });
  it("keeps each homepage tab useful without inventing open listings", async () => {
    renderAt("/");
    expect(screen.queryByText("Nothing here just yet")).toBeNull();
    expect(screen.getByRole("region",{name:"Hackathon discovery previews"})).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Jobs",exact:true}));
    expect(screen.queryByRole("link",{name:"Visit Google",exact:true})).toBeNull();
    expect(screen.getByRole("heading",{name:"No published listings in this category yet"})).toBeInTheDocument();
    expect(document.querySelectorAll(".opportunity-card .card-deadline")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button",{name:"Competitions",exact:true}));
    expect(screen.queryByRole("link",{name:"Visit Kaggle Competitions",exact:true})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Hackathons",exact:true}));
    expect(screen.getByRole("link",{name:"Browse all hackathon resources"})).toHaveAttribute("href","/explore?type=hackathon");
  });
  it.each([['internship','Internships'],['job','Jobs'],['competition','Competitions'],['hackathon','Hackathons']])("opens the %s category box with useful content", async(type,title) => {
    renderAt("/");
    fireEvent.click(document.querySelector(`.path-card.${type}`));
    await waitFor(()=>expect(screen.getByRole("heading",{level:1})).toHaveTextContent(title));
    if(type!=="hackathon") expect(screen.getByRole("heading",{name:"No matching opportunities"})).toBeInTheDocument();
    if(type==='hackathon') expect(screen.getByRole('heading',{name:'Hackathons to explore'})).toBeInTheDocument();
    else expect(screen.queryByRole('link',{name:'Visit Google',exact:true})).toBeNull();
  });
});
it("opens a homepage resource by clicking its heading", async () => {
  vi.mocked(Date.now).mockReturnValue(Date.parse("2026-11-11T12:00:00Z"));
  renderAt("/");
  fireEvent.click(screen.getByRole("heading",{name:"TreeHacks",exact:true}));
  await waitFor(()=>expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Hackathons"));
  expect(screen.getByRole("heading",{name:"Hackathons to explore"})).toBeInTheDocument();
});
