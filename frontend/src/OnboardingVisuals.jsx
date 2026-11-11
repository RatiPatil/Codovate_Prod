import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { normalizeName } from "./profileNames";

export function StudentPreview({ draft, complete = false }) {
  const skills = [
    ...new Set(
      draft.skillsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <aside
      className="onboarding-student-card"
      aria-label="Live student profile preview"
    >
      <div className="onboarding-card-banner">
        <Sparkles size={20} aria-hidden="true" />
        <span>
          {complete ? "YOUR CODOVATE IDENTITY" : "YOUR PROFILE, COMING TO LIFE"}
        </span>
      </div>
      <div className="onboarding-avatar" aria-hidden="true">
        {normalizeName(draft.name)
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join("") || "CV"}
      </div>
      <h2>{normalizeName(draft.name) || "YOUR FULL NAME"}</h2>
      <p className="onboarding-role">
        {draft.preferences.desiredRole || "Your future starts here"}
      </p>
      <p className="onboarding-card-line">
        <GraduationCap size={16} aria-hidden="true" />
        {[draft.college, draft.preferences.yearOfStudy]
          .filter(Boolean)
          .join(" · ") || "Your college & study year"}
      </p>
      <p className="onboarding-card-line">
        <MapPin size={16} aria-hidden="true" />
        {draft.city || "Your city"}
      </p>
      <div className="onboarding-card-section">
        <h3>Skills & strengths</h3>
        <div className="onboarding-tags">
          {skills.length ? (
            skills.map((skill) => <span key={skill}>{skill}</span>)
          ) : (
            <span>
              {draft.preferences.justStarting
                ? "Learning & exploring"
                : "Add your skills"}
            </span>
          )}
        </div>
      </div>
      <div className="onboarding-card-section">
        <h3>Working towards</h3>
        <div className="onboarding-tags">
          {draft.preferences.goals.length ? (
            draft.preferences.goals.map((goal) => (
              <span key={goal}>{goal}</span>
            ))
          ) : (
            <span>Your career goals</span>
          )}
        </div>
      </div>
      <div className="onboarding-card-section">
        <h3>Looking to connect with</h3>
        <div className="onboarding-tags">
          {draft.preferences.seeking.length ? (
            draft.preferences.seeking.map((item) => (
              <span key={item}>{item}</span>
            ))
          ) : (
            <span>Your future teammates</span>
          )}
        </div>
      </div>
      {draft.bio && <p className="onboarding-card-bio">{draft.bio}</p>}
      <p className="onboarding-card-private">
        <ShieldCheck size={15} aria-hidden="true" />
        Private preview. You control discovery.
      </p>
    </aside>
  );
}

export function OnboardingWelcome({ name, onStart }) {
  const firstName = normalizeName(name).split(" ")[0];
  return (
    <section
      className="container section onboarding-shell onboarding-welcome"
      aria-labelledby="onboarding-welcome-title"
    >
      <div>
        <span className="onboarding-kicker">
          <Sparkles size={16} aria-hidden="true" />
          YOUR NEXT CHAPTER STARTS HERE
        </span>
        <h1 id="onboarding-welcome-title">
          {firstName ? `Welcome, ${firstName}.` : "Welcome to Codovate."}
          <br />
          <span>Great things start with you.</span>
        </h1>
        <p>
          Find your direction. Meet your people. Build something that matters.
        </p>
        <p>
          Let’s build your student profile so your next opportunity—and your
          next team—can start with the real you.
        </p>
        <div className="onboarding-welcome-points">
          <span>
            <GraduationCap size={20} aria-hidden="true" />
            Your journey
          </span>
          <span>
            <Sparkles size={20} aria-hidden="true" />
            Your strengths
          </span>
          <span>
            <Users size={20} aria-hidden="true" />
            Your people
          </span>
        </div>
        <button className="button" onClick={onStart}>
          Let’s build my profile <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="hint">
          Four clear steps. Your progress saves as you go. All profile questions
          are required.
        </p>
      </div>
      <img
        src="/images/onboarding/build-together.svg"
        alt="An illustrated student profile connecting skills, learning and teammates"
        width="640"
        height="440"
      />
    </section>
  );
}

export function OnboardingSuccess({ draft, destination, discoverable }) {
  const title = useRef(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  return (
    <section
      className="container section onboarding-shell onboarding-success"
      aria-labelledby="onboarding-success-title"
    >
      <div className="onboarding-confetti" aria-hidden="true">
        {Array.from({ length: 30 }, (_, index) => (
          <i
            key={index}
            style={{
              "--piece": index,
              "--left": `${(index * 37) % 100}%`,
              "--color": ["#6457e8", "#d5b45c", "#79aa94", "#bba9ec"][
                index % 4
              ],
            }}
          />
        ))}
      </div>
      <div className="onboarding-success-heading">
        <img
          src="/images/onboarding/ready-to-grow.svg"
          alt="A rocket ready to launch your next chapter"
          width="480"
          height="300"
        />
        <span className="onboarding-kicker">
          <Sparkles size={16} aria-hidden="true" />
          YOU’RE ALL SET
        </span>
        <h1 ref={title} tabIndex={-1} id="onboarding-success-title">
          Your next chapter is ready.
        </h1>
        <p>
          Welcome aboard, {normalizeName(draft.name)}. Your profile is saved—now
          make your first connection, explore opportunities, and start building.
        </p>
      </div>
      <StudentPreview draft={draft} complete />
      <p className="hint">
        {discoverable
          ? "Your name and skills are discoverable. Your other details remain private."
          : "Your profile is private. You can turn on teammate discovery in Find a team."}
      </p>
      <Link className="button" to={destination} replace>
        Enter my workspace <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
