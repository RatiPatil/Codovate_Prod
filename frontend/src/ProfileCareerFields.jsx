import { domains, experienceLevels, seekingOptions } from "./discoveryData";
import {
  careerGoals,
  studyYears,
  availabilityOptions,
  collaborationModes,
} from "./onboardingContract";
export function ProfileCareerFields({ profile }) {
  const p = profile?.careerPreferences || {};
  const selects = [
    ["domain", "Career domain", domains],
    ["experience", "Experience level", experienceLevels],
    ["yearOfStudy", "Year of study", studyYears],
    ["availability", "Availability", availabilityOptions],
    ["mode", "Collaboration mode", collaborationModes],
  ];
  return (
    <section
      className="profile-career-fields"
      aria-label="Career direction and collaboration"
    >
      <h2>Career direction & collaboration</h2>
      <p className="hint">
        Tell potential collaborators what you want to build and where you want
        to grow. Discovery sharing remains under your control in Find a team.
      </p>
      <div className="form-grid">
        <label>
          Desired role
          <input
            name="desiredRole"
            maxLength={100}
            required
            defaultValue={p.desiredRole || ""}
            placeholder="For example: Frontend Developer"
          />
        </label>
        {selects.map(([name, label, options]) => (
          <label key={name}>
            {label}
            <select name={name} required defaultValue={p[name] || ""}>
              <option value="" disabled>
                Choose {label.toLowerCase()}
              </option>
              {options.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <fieldset>
        <legend>Career goals · choose at least one</legend>
        <div className="profile-interest-grid">
          {careerGoals.map((v) => (
            <label className="hub-check" key={v}>
              <input
                type="checkbox"
                name="goals"
                value={v}
                defaultChecked={p.goals?.includes(v) || false}
              />
              {v}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Looking to connect with</legend>
        <div className="profile-interest-grid">
          {seekingOptions.map((v) => (
            <label className="hub-check" key={v}>
              <input
                type="checkbox"
                name="seeking"
                value={v}
                defaultChecked={p.seeking?.includes(v) || false}
              />
              {v}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="hub-check">
        <input
          type="checkbox"
          name="justStarting"
          defaultChecked={p.justStarting || false}
        />
        I am just starting and will add skills as I learn.
      </label>
    </section>
  );
}
