import { passionOptions } from "./discoveryData";
export function profileInterests(form) {
  const achievements = [
    ...new Set(
      String(form.get("achievements") || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  const passions = [...new Set(form.getAll("passions"))];
  if (
    achievements.length > 6 ||
    achievements.some((v) => v.length > 60 || /[\r\n]/.test(v))
  )
    throw new Error(
      "Add up to six achievements, each within 60 characters. Separate them with commas.",
    );
  if (passions.length > 6 || passions.some((v) => !passionOptions.includes(v)))
    throw new Error("Choose the listed interests.");
  return { achievements, passions };
}
export function ProfileInterests({ profile }) {
  return (
    <>
      <h2>Achievements · self-reported</h2>
      <label>
        Your achievements
        <input
          name="achievements"
          maxLength={365}
          defaultValue={profile?.teammateCard?.achievements?.join(", ") || ""}
          placeholder="Hackathon participant, Research publication"
        />
      </label>
      <p className="hint">Add up to six achievements, separated by commas.</p>
      <fieldset>
        <legend>Passionate about</legend>
        <div className="form-grid">
          {passionOptions.map((value) => (
            <label className="hub-check" key={value}>
              <input
                type="checkbox"
                name="passions"
                value={value}
                defaultChecked={
                  profile?.teammateCard?.passions?.includes(value) || false
                }
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
