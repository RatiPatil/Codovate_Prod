import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSession } from "./session";
import { safeReturnPath } from "./authSupport";
import { domains, experienceLevels, seekingOptions } from "./discoveryData";
import { normalizeName } from "./profileNames";
import {
  fullNameFromParts,
  onboardingFieldErrors,
} from "./onboardingValidation";
import {
  availabilityOptions,
  careerGoals,
  collaborationModes,
  needsOnboarding,
  onboardingDraft,
  saveOnboarding,
  studyYears,
} from "./onboardingData";
import {
  OnboardingWelcome,
  OnboardingSuccess,
  StudentPreview,
} from "./OnboardingVisuals";
import "./onboarding.css";

function resumeStep(profile, user) {
  const draft = onboardingDraft(profile, user);
  return Object.keys(onboardingFieldErrors(draft, 1)).length
    ? 1
    : profile?.onboarding?.step || 1;
}

const fieldLabels = {
  "nameParts.first": "First name",
  "nameParts.middle": "Middle name",
  "nameParts.last": "Last name",
  city: "City",
  mobile: "Mobile number",
  college: "College / institution",
  degree: "Course / degree",
  program: "Specialization / field of study",
  graduationYear: "Graduation year",
  skillsText: "Skills (comma separated)",
  bio: "Introduce yourself",
  "preferences.yearOfStudy": "Study stage",
  "preferences.desiredRole": "Desired professional role",
  "preferences.domain": "Area of interest",
  "preferences.experience": "Experience level",
  "preferences.availability": "Weekly availability",
  "preferences.mode": "Preferred collaboration mode",
};
const steps = ["About you", "Education", "Skills & goals", "Collaboration"];

function Choices({
  label,
  options,
  value,
  onChange,
  disabled,
  fieldKey,
  invalid,
}) {
  return (
    <fieldset
      className="onboarding-choices"
      disabled={disabled}
      data-field={fieldKey}
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `error-${fieldKey}` : undefined}
    >
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
  const [showWelcome, setShowWelcome] = useState(
    resumeStep(profile, user) === 1,
  );
  const [step, setStep] = useState(resumeStep(profile, user));
  const [discoverable, setDiscoverable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
      setStep(resumeStep(profile, user));
      setShowWelcome(resumeStep(profile, user) === 1);
    }
  }, [profile, user, createProfile]);

  useEffect(() => {
    heading.current?.focus();
  }, [step, showWelcome]);
  function field(key, value) {
    setDraft((current) => {
      if (key.startsWith("nameParts.")) {
        const nameParts = { ...current.nameParts, [key.split(".")[1]]: value };
        return { ...current, nameParts, name: fullNameFromParts(nameParts) };
      }
      return { ...current, [key]: value };
    });
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }
  function checkField(key) {
    const errors = onboardingFieldErrors(draft, step);
    setFieldErrors((current) => ({ ...current, [key]: errors[key] }));
  }
  function inputProps(key) {
    return {
      "data-field": key,
      "aria-label": fieldLabels[key],
      "aria-invalid": !!fieldErrors[key],
      "aria-describedby": fieldErrors[key] ? `error-${key}` : undefined,
      onBlur: () => checkField(key),
    };
  }
  function inlineError(key) {
    return fieldErrors[key] ? (
      <span className="onboarding-field-error" id={`error-${key}`}>
        {fieldErrors[key]}
      </span>
    ) : null;
  }
  function preference(key, value) {
    setFieldErrors((current) => ({
      ...current,
      [`preferences.${key}`]: undefined,
    }));
    setDraft((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  }
  async function save(event, leave = false) {
    event?.preventDefault();
    if (busy || waitingForProfile) return;
    const errors = onboardingFieldErrors(draft, step, leave);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("Check the highlighted fields before continuing.");
      const first = document.querySelector(
        `[data-field="${Object.keys(errors)[0]}"]`,
      );
      first?.focus();
      return;
    }
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
      if (failure.fields) setFieldErrors(failure.fields);
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
  if (waitingForProfile && !busy && profile?.onboarding?.status === "completed")
    return (
      <OnboardingSuccess
        draft={draft}
        destination={safeReturnPath(location.state?.from)}
        discoverable={discoverable}
      />
    );
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

  if (showWelcome)
    return (
      <OnboardingWelcome
        name={draft.name}
        onStart={() => setShowWelcome(false)}
      />
    );

  return (
    <section
      className="container section onboarding-shell"
      aria-label="Account onboarding"
    >
      <div className="onboarding-heading">
        <span className="eyebrow">BUILD YOUR CODOVATE IDENTITY</span>
        <h1>Let’s make this yours.</h1>
        <p>
          Your journey, strengths and goals belong here. Complete each step to
          build a profile that represents you. All profile questions are
          required.
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
      <div className="onboarding-layout">
        <form
          className="panel profile-form onboarding-form"
          onSubmit={save}
          noValidate
        >
          <p className="eyebrow">STEP {step} OF 4</p>
          <div className="onboarding-step-caption">
            {
              [
                "A good introduction opens new doors.",
                "Tell us where you’re learning and where you’re headed.",
                "Show your strengths and choose your direction.",
                "Great work starts with the right people.",
              ][step - 1]
            }
          </div>
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
                  Enter your first, middle and last name as you want them on
                  your profile. Your full name will be saved in uppercase.
                </p>
                <div className="onboarding-name-fields">
                  {[
                    ["first", "First name", "given-name"],
                    ["middle", "Middle name", "additional-name"],
                    ["last", "Last name", "family-name"],
                  ].map(([key, label, autocomplete]) => (
                    <label key={key}>
                      {label}
                      <input
                        {...inputProps(`nameParts.${key}`)}
                        name={key}
                        autoComplete={autocomplete}
                        placeholder={`Enter your ${label.toLowerCase()}`}
                        maxLength={40}
                        value={draft.nameParts[key]}
                        onChange={(event) =>
                          field(`nameParts.${key}`, event.target.value)
                        }
                        required
                      />
                      {inlineError(`nameParts.${key}`)}
                    </label>
                  ))}
                </div>
                <p className="hint" id="name-preview">
                  Profile name:{" "}
                  <strong>
                    {normalizeName(draft.name) || "YOUR FULL NAME"}
                  </strong>
                </p>
                <label>
                  City
                  <input
                    required
                    placeholder="Enter your city"
                    {...inputProps("city")}
                    autoComplete="address-level2"
                    maxLength={100}
                    value={draft.city}
                    onChange={(event) => field("city", event.target.value)}
                  />
                  {inlineError("city")}
                </label>
                <label>
                  Mobile number
                  <span className="onboarding-phone">
                    <span aria-hidden="true">+91</span>
                    <input
                      {...inputProps("mobile")}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={draft.mobile}
                      onChange={(event) =>
                        field("mobile", event.target.value.replace(/\D/g, ""))
                      }
                      required
                      aria-label="Mobile number"
                    />
                  </span>
                  {inlineError("mobile")}
                  <span className="hint">
                    Enter 10 digits without the country code. This is saved
                    privately as your contact number.
                  </span>
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
                    {...inputProps("college")}
                    value={draft.college}
                    onChange={(event) => field("college", event.target.value)}
                  />
                  {inlineError("college")}
                </label>
                <label>
                  Course / degree
                  <input
                    required
                    maxLength={100}
                    placeholder="For example, B.Tech or MCA"
                    {...inputProps("degree")}
                    value={draft.degree}
                    onChange={(event) => field("degree", event.target.value)}
                  />
                  {inlineError("degree")}
                </label>
                <label>
                  Specialization / field of study
                  <input
                    maxLength={180}
                    required
                    placeholder="For example, Computer Science"
                    {...inputProps("program")}
                    value={draft.program}
                    onChange={(event) => field("program", event.target.value)}
                  />
                  {inlineError("program")}
                </label>
                <label>
                  Study stage
                  <select
                    required
                    {...inputProps("preferences.yearOfStudy")}
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
                  {inlineError("preferences.yearOfStudy")}
                </label>
                <label>
                  Graduation year
                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="For example, 2027"
                    {...inputProps("graduationYear")}
                    value={draft.graduationYear}
                    onChange={(event) =>
                      field("graduationYear", event.target.value)
                    }
                  />
                  {inlineError("graduationYear")}
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
                      {...inputProps("preferences.desiredRole")}
                      value={draft.preferences.desiredRole}
                      onChange={(event) =>
                        preference("desiredRole", event.target.value)
                      }
                    />
                    {inlineError("preferences.desiredRole")}
                  </label>
                  <label>
                    Area of interest
                    <select
                      required
                      {...inputProps("preferences.domain")}
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
                    {inlineError("preferences.domain")}
                  </label>
                  <label>
                    Experience level
                    <select
                      {...inputProps("preferences.experience")}
                      value={draft.preferences.experience}
                      onChange={(event) =>
                        preference("experience", event.target.value)
                      }
                    >
                      {experienceLevels.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    {inlineError("preferences.experience")}
                  </label>
                </div>
                <label>
                  Skills (comma separated)
                  <input
                    maxLength={1200}
                    placeholder="React, Python, Design…"
                    {...inputProps("skillsText")}
                    value={draft.skillsText}
                    onChange={(event) =>
                      field("skillsText", event.target.value)
                    }
                  />
                  {inlineError("skillsText")}
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
                  fieldKey="preferences.goals"
                  invalid={!!fieldErrors["preferences.goals"]}
                  onChange={(value) => preference("goals", value)}
                />
                {inlineError("preferences.goals")}
                <label>
                  Introduce yourself
                  <textarea
                    required
                    placeholder="Tell future teammates what you enjoy learning and building."
                    maxLength={1500}
                    rows={3}
                    {...inputProps("bio")}
                    value={draft.bio}
                    onChange={(event) => field("bio", event.target.value)}
                  />
                  {inlineError("bio")}
                </label>
              </>
            )}
            {step === 4 && (
              <>
                <div className="form-grid">
                  <label>
                    Weekly availability
                    <select
                      {...inputProps("preferences.availability")}
                      value={draft.preferences.availability}
                      onChange={(event) =>
                        preference("availability", event.target.value)
                      }
                    >
                      {availabilityOptions.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    {inlineError("preferences.availability")}
                  </label>
                  <label>
                    Preferred collaboration mode
                    <select
                      {...inputProps("preferences.mode")}
                      value={draft.preferences.mode}
                      onChange={(event) =>
                        preference("mode", event.target.value)
                      }
                    >
                      {collaborationModes.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    {inlineError("preferences.mode")}
                  </label>
                </div>
                <Choices
                  label="Who would you like to find? Choose at least one."
                  options={seekingOptions}
                  value={draft.preferences.seeking}
                  fieldKey="preferences.seeking"
                  invalid={!!fieldErrors["preferences.seeking"]}
                  onChange={(value) => preference("seeking", value)}
                />
                {inlineError("preferences.seeking")}
                <label className="onboarding-check">
                  <input
                    type="checkbox"
                    checked={discoverable}
                    onChange={(event) => setDiscoverable(event.target.checked)}
                  />
                  Make my name and skills discoverable to other signed-in
                  members
                </label>
                <p className="hint">
                  You control visibility. Turn discovery on to share only your
                  name and skills. Your contact information, résumé, education
                  details and collaboration preferences stay private. You can
                  manage discovery later in Find a team.
                </p>
              </>
            )}
          </fieldset>
          {waitingForProfile && (
            <p role="status">Profile saved. Preparing your welcome…</p>
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
        <div className="onboarding-preview-column">
          <StudentPreview draft={draft} />
          <div className="onboarding-side-note">
            <img
              src="/images/onboarding/build-together.svg"
              alt=""
              width="640"
              height="440"
            />
            <p>A little ambition. A world of possibility.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
