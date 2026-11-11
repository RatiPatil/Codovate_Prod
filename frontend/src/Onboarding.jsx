import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSession } from "./session";
import { safeReturnPath } from "./authSupport";
import { domains, experienceLevels, seekingOptions } from "./discoveryData";
import { normalizeName } from "./profileNames";
import {
  availabilityOptions,
  careerGoals,
  collaborationModes,
  needsOnboarding,
  onboardingDraft,
  saveOnboarding,
  studyYears,
} from "./onboardingData";
import "./onboarding.css";

const steps = ["About you", "Education", "Skills & goals", "Collaboration"];

function Choices({ label, options, value, onChange, disabled }) {
  return (
    <fieldset className="onboarding-choices" disabled={disabled}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, option]
                    : value.filter((item) => item !== option),
                )
              }
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function OnboardingGate({ children }) {
  const { user, profile, admin, loading, sessionError } = useSession();
  const location = useLocation();
  if (
    user &&
    !admin &&
    !loading &&
    !sessionError &&
    needsOnboarding(profile) &&
    location.pathname !== "/onboarding"
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{
          from: safeReturnPath(
            location.state?.from || location.pathname + location.search,
          ),
        }}
      />
    );
  }
  return children;
}

export function Onboarding() {
  const { user, profile, createProfile, logout } = useSession();
  const location = useLocation();
  const [draft, setDraft] = useState(() => onboardingDraft(profile, user));
  const [step, setStep] = useState(profile?.onboarding?.step || 1);
  const [discoverable, setDiscoverable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const creating = useRef(false);
  const hydrated = useRef(!!profile);
  const heading = useRef(null);

  useEffect(() => {
    if (!profile && user && !creating.current) {
      creating.current = true;
      createProfile(user).catch(() => {
        creating.current = false;
        setError(
          "Your profile could not be created. Reload the page to retry the account connection.",
        );
      });
    }
    if (profile && !hydrated.current) {
      hydrated.current = true;
      setDraft(onboardingDraft(profile, user));
      setStep(profile.onboarding?.step || 1);
    }
  }, [profile, user, createProfile]);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  function field(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function preference(key, value) {
    setDraft((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  }
  async function save(event, leave = false) {
    event?.preventDefault();
    if (busy || waitingForProfile) return;
    setBusy(true);
    setError("");
    try {
      const complete = !leave && step === 4;
      await saveOnboarding(user, draft, step, {
        complete,
        partial: leave,
        discoverable,
      });
      if (leave) await logout();
      else if (complete) setWaitingForProfile(true);
      else setStep((current) => Math.min(current + 1, 4));
    } catch (failure) {
      setError(
        failure.code
          ? "Could not save your progress. Check your connection and make sure the latest Firebase rules are deployed, then retry."
          : failure.message,
      );
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <Navigate to="/login" replace state={location.state} />;
  if (profile && !needsOnboarding(profile) && !busy)
    return <Navigate to={safeReturnPath(location.state?.from)} replace />;
  if (!profile)
    return (
      <div className="container section">
        <div className="panel">
          <h1>Preparing your profile…</h1>
          <p role={error ? "alert" : "status"}>
            {error ||
              "Connecting your account. Your progress will be saved privately."}
          </p>
        </div>
      </div>
    );

  return (
    <section
      className="container section onboarding-shell"
      aria-label="Account onboarding"
    >
      <div className="onboarding-heading">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>Let’s make this yours.</h1>
        <p>
          A few details help you find opportunities and build the right team.
          Your progress is saved after each step.
        </p>
      </div>
      <ol className="onboarding-steps" aria-label="Setup progress">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? "step" : undefined}
            className={step > index + 1 ? "complete" : ""}
          >
            <span>
              {step > index + 1 ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <form
        className="panel profile-form onboarding-form"
        onSubmit={save}
        noValidate
      >
        <p className="eyebrow">STEP {step} OF 4</p>
        <h2 ref={heading} tabIndex={-1}>
          {steps[step - 1]}
        </h2>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <fieldset
          disabled={busy || waitingForProfile}
          className="onboarding-fields"
        >
          {step === 1 && (
            <>
              <p>
                Confirm your full name. We’ll save it in uppercase for your
                profile and team identity.
              </p>
              <label>
                Your full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  maxLength={100}
                  value={draft.name}
                  onChange={(event) => field("name", event.target.value)}
                  required
                  aria-describedby="name-preview"
                />
              </label>
              <p className="hint" id="name-preview">
                Profile name:{" "}
                <strong>{normalizeName(draft.name) || "YOUR FULL NAME"}</strong>
              </p>
              <label>
                City (optional)
                <input
                  autoComplete="address-level2"
                  maxLength={100}
                  value={draft.city}
                  onChange={(event) => field("city", event.target.value)}
                />
              </label>
            </>
          )}
          {step === 2 && (
            <div className="form-grid">
              <label>
                College / institution
                <input
                  required
                  maxLength={180}
                  value={draft.college}
                  onChange={(event) => field("college", event.target.value)}
                />
              </label>
              <label>
                Course / degree
                <input
                  required
                  maxLength={100}
                  placeholder="For example, B.Tech or MCA"
                  value={draft.degree}
                  onChange={(event) => field("degree", event.target.value)}
                />
              </label>
              <label>
                Specialization (optional)
                <input
                  maxLength={180}
                  value={draft.program}
                  onChange={(event) => field("program", event.target.value)}
                />
              </label>
              <label>
                Study stage
                <select
                  required
                  value={draft.preferences.yearOfStudy}
                  onChange={(event) =>
                    preference("yearOfStudy", event.target.value)
                  }
                >
                  <option value="">Choose your stage</option>
                  {studyYears.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Graduation year
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="For example, 2027"
                  value={draft.graduationYear}
                  onChange={(event) =>
                    field("graduationYear", event.target.value)
                  }
                />
              </label>
            </div>
          )}
          {step === 3 && (
            <>
              <div className="form-grid">
                <label>
                  Desired professional role
                  <input
                    required
                    maxLength={100}
                    placeholder="For example, Frontend Developer"
                    value={draft.preferences.desiredRole}
                    onChange={(event) =>
                      preference("desiredRole", event.target.value)
                    }
                  />
                </label>
                <label>
                  Area of interest
                  <select
                    required
                    value={draft.preferences.domain}
                    onChange={(event) =>
                      preference("domain", event.target.value)
                    }
                  >
                    <option value="">Choose an interest</option>
                    {domains.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Experience level
                  <select
                    value={draft.preferences.experience}
                    onChange={(event) =>
                      preference("experience", event.target.value)
                    }
                  >
                    {experienceLevels.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Skills (comma separated)
                <input
                  maxLength={1200}
                  placeholder="React, Python, Design…"
                  value={draft.skillsText}
                  onChange={(event) => field("skillsText", event.target.value)}
                />
              </label>
              <label className="onboarding-check">
                <input
                  type="checkbox"
                  checked={draft.preferences.justStarting}
                  onChange={(event) =>
                    preference("justStarting", event.target.checked)
                  }
                />
                I’m just starting and still exploring my skills
              </label>
              <Choices
                label="What are your goals? Choose at least one."
                options={careerGoals}
                value={draft.preferences.goals}
                onChange={(value) => preference("goals", value)}
              />
              <label>
                Short introduction (optional)
                <textarea
                  maxLength={1500}
                  rows={3}
                  value={draft.bio}
                  onChange={(event) => field("bio", event.target.value)}
                />
              </label>
              <label>
                Portfolio or project link (optional)
                <input
                  type="url"
                  maxLength={500}
                  placeholder="https://…"
                  value={draft.portfolio}
                  onChange={(event) => field("portfolio", event.target.value)}
                />
              </label>
            </>
          )}
          {step === 4 && (
            <>
              <div className="form-grid">
                <label>
                  Weekly availability
                  <select
                    value={draft.preferences.availability}
                    onChange={(event) =>
                      preference("availability", event.target.value)
                    }
                  >
                    {availabilityOptions.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred collaboration mode
                  <select
                    value={draft.preferences.mode}
                    onChange={(event) => preference("mode", event.target.value)}
                  >
                    {collaborationModes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Choices
                label="What would you like to find? (optional)"
                options={seekingOptions}
                value={draft.preferences.seeking}
                onChange={(value) => preference("seeking", value)}
              />
              <div className="onboarding-preview">
                <h3>Your profile</h3>
                <strong>{normalizeName(draft.name)}</strong>
                <p>
                  {draft.preferences.desiredRole} · {draft.preferences.domain}
                </p>
                <p>
                  {draft.college} · {draft.degree} · {draft.graduationYear}
                </p>
                <p>{draft.skillsText || "Just starting"}</p>
              </div>
              <label className="onboarding-check">
                <input
                  type="checkbox"
                  checked={discoverable}
                  onChange={(event) => setDiscoverable(event.target.checked)}
                />
                Make my name and skills discoverable to other signed-in members
              </label>
              <p className="hint">
                Discovery is optional. Only your name and skills will be shared.
                Your contact information, résumé, education details and
                collaboration preferences stay private. You can manage discovery
                later in Find a team.
              </p>
            </>
          )}
        </fieldset>
        {waitingForProfile && (
          <p role="status">Profile saved. Opening your workspace…</p>
        )}
        <div className="onboarding-actions">
          {step > 1 && (
            <button
              className="button secondary"
              type="button"
              disabled={busy || waitingForProfile}
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
            >
              Back
            </button>
          )}
          <button className="button" disabled={busy || waitingForProfile}>
            {busy
              ? "Saving…"
              : step === 4
                ? "Complete setup"
                : "Save and continue"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            className="text-link"
            type="button"
            disabled={busy || waitingForProfile}
            onClick={() => save(null, true)}
          >
            Save and sign out
          </button>
        </div>
      </form>
    </section>
  );
}
