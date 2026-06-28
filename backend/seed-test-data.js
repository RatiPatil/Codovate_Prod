require("dotenv").config();
const { db } = require("./config/firebase");

const seedData = async () => {
  console.log("🌱 Starting Codovate Seed Script...");

  const students = [
    {
      id: "student_1",
      email: "rahul.sharma@example.com",
      name: "Rahul Sharma",
      role: "student",
      is_active: true,
      onboarding_done: true,
      created_at: new Date()
    },
    {
      id: "student_2",
      email: "priya.patel@example.com",
      name: "Priya Patel",
      role: "student",
      is_active: true,
      onboarding_done: true,
      created_at: new Date()
    },
    {
      id: "student_3",
      email: "amit.kumar@example.com",
      name: "Amit Kumar",
      role: "student",
      is_active: true,
      onboarding_done: true,
      created_at: new Date()
    },
    {
      id: "student_4",
      email: "sneha.gupta@example.com",
      name: "Sneha Gupta",
      role: "student",
      is_active: true,
      onboarding_done: true,
      created_at: new Date()
    },
    {
      id: "student_5",
      email: "vikram.singh@example.com",
      name: "Vikram Singh",
      role: "student",
      is_active: true,
      onboarding_done: true,
      created_at: new Date()
    }
  ];

  const studentProfiles = {
    "student_1": {
      college: "IIT Bombay", branch: "Computer Science", year: 3,
      skills: ["React", "Node.js", "MongoDB", "JavaScript"],
      career_goal: "Full Stack Developer", career_interests: ["Web Development", "Cloud"],
      experience_level: "Intermediate", profile_completion: 100, bio: "Passionate about building scalable web apps."
    },
    "student_2": {
      college: "NIT Trichy", branch: "Information Technology", year: 4,
      skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
      career_goal: "Data Scientist", career_interests: ["Data Science", "AI/ML"],
      experience_level: "Advanced", profile_completion: 90, bio: "Data enthusiast with a knack for patterns."
    },
    "student_3": {
      college: "BITS Pilani", branch: "Electronics", year: 2,
      skills: ["C++", "Java", "DSA"],
      career_goal: "Software Engineer", career_interests: ["Software Dev"],
      experience_level: "Beginner", profile_completion: 70, bio: "Learning the ropes of competitive programming."
    },
    "student_4": {
      college: "VIT Vellore", branch: "Computer Science", year: 3,
      skills: ["Figma", "React", "Tailwind CSS"],
      career_goal: "UI/UX Designer", career_interests: ["UI/UX", "Frontend"],
      experience_level: "Intermediate", profile_completion: 85, bio: "Design is not just what it looks like, but how it works."
    },
    "student_5": {
      college: "Delhi Technological University", branch: "Software Eng.", year: 4,
      skills: ["Docker", "AWS", "Kubernetes", "Linux"],
      career_goal: "DevOps Engineer", career_interests: ["Cloud", "DevOps"],
      experience_level: "Advanced", profile_completion: 95, bio: "Automating all the things."
    }
  };

  const mentors = [
    {
      id: "mentor_1",
      user_id: "mentor_user_1",
      is_active: true,
      hourly_rate: 500,
      expertise: ["System Design", "React", "Node.js", "Career Advice"],
      bio: "Senior SDE at Google. Helping students crack FAANG.",
      created_at: new Date()
    },
    {
      id: "mentor_2",
      user_id: "mentor_user_2",
      is_active: true,
      hourly_rate: 0,
      expertise: ["Machine Learning", "Data Science", "Python"],
      bio: "Data Scientist at Microsoft. Happy to review ML projects.",
      created_at: new Date()
    },
    {
      id: "mentor_3",
      user_id: "mentor_user_3",
      is_active: true,
      hourly_rate: 300,
      expertise: ["UI/UX", "Figma", "Frontend Development"],
      bio: "Lead Designer at Razorpay. Can help with portfolio reviews.",
      created_at: new Date()
    }
  ];

  const mentorUsers = [
    { id: "mentor_user_1", email: "karan.sde@example.com", name: "Karan SDE", role: "mentor", is_active: true },
    { id: "mentor_user_2", email: "neha.ml@example.com", name: "Neha Data", role: "mentor", is_active: true },
    { id: "mentor_user_3", email: "rohit.design@example.com", name: "Rohit Design", role: "mentor", is_active: true }
  ];

  const teams = [
    {
      id: "team_1",
      name: "Code Ninjas",
      join_code: "NINJA1",
      created_by: "student_1",
      created_at: new Date()
    },
    {
      id: "team_2",
      name: "Data Miners",
      join_code: "DATA2X",
      created_by: "student_2",
      created_at: new Date()
    }
  ];

  const teamMembers = [
    { id: "tm_1", team_id: "team_1", user_id: "student_1", joined_at: new Date() },
    { id: "tm_2", team_id: "team_1", user_id: "student_4", joined_at: new Date() },
    { id: "tm_3", team_id: "team_2", user_id: "student_2", joined_at: new Date() },
    { id: "tm_4", team_id: "team_2", user_id: "student_5", joined_at: new Date() }
  ];

  const opportunities = [
    {
      id: "opp_1",
      title: "Google Summer Internship 2027",
      type: "Internship",
      description: "Join the Google team for a 3-month summer internship working on cutting-edge technologies.",
      company: "Google",
      deadline: "2026-10-31",
      prize_pool: "Stipend: ₹1,50,000/month",
      eligibility: "Pre-final year students (B.Tech)",
      mode: "In-Person",
      location: "Bangalore",
      registration_link: "https://careers.google.com/students",
      start_date: "2027-05-01",
      end_date: "2027-07-31",
      is_featured: true,
      required_skills: ["Python", "Java", "Data Structures", "Algorithms"],
      is_active: true,
      view_count: 125,
      created_at: new Date()
    },
    {
      id: "opp_2",
      title: "Smart India Hackathon 2026",
      type: "Hackathon",
      description: "World's biggest open innovation model for students to solve real-world problems.",
      company: "Government of India",
      deadline: "2026-08-15",
      prize_pool: "₹1,00,000 per problem statement",
      eligibility: "All engineering students",
      mode: "Hybrid",
      location: "Various Nodal Centers",
      registration_link: "https://sih.gov.in",
      start_date: "2026-11-01",
      end_date: "2026-11-05",
      is_featured: true,
      required_skills: ["React", "Node.js", "MongoDB", "AI/ML", "IoT"],
      is_active: true,
      view_count: 540,
      created_at: new Date()
    },
    {
      id: "opp_3",
      title: "Meta Frontend Engineering Internship",
      type: "Internship",
      description: "Help build the next generation of social experiences at Meta using React and GraphQL.",
      company: "Meta",
      deadline: "2026-09-30",
      prize_pool: "Stipend: ₹1,20,000/month",
      eligibility: "Final year and pre-final year",
      mode: "Remote",
      location: "Remote (India)",
      registration_link: "https://metacareers.com",
      start_date: "2027-01-15",
      end_date: "2027-06-15",
      is_featured: false,
      required_skills: ["JavaScript", "React", "TypeScript", "Frontend"],
      is_active: true,
      view_count: 89,
      created_at: new Date()
    },
    {
      id: "opp_4",
      title: "AWS Cloud Quest Competition",
      type: "Competition",
      description: "Solve cloud architecture challenges and win AWS credits and swags.",
      company: "Amazon Web Services",
      deadline: "2026-07-20",
      prize_pool: "AWS Credits + Swags + Echo Dot",
      eligibility: "Open to all students",
      mode: "Online",
      location: "Online",
      registration_link: "https://aws.amazon.com/education",
      start_date: "2026-07-25",
      end_date: "2026-07-27",
      is_featured: false,
      required_skills: ["AWS", "Cloud Computing", "Docker"],
      is_active: true,
      view_count: 45,
      created_at: new Date()
    }
  ];

  try {
    // 1. Seed Students
    for (const s of students) {
      await db.collection("users").doc(s.id).set(s, { merge: true });
      if (studentProfiles[s.id]) {
        await db.collection("student_profiles").doc(s.id).set({
          ...studentProfiles[s.id], user_id: s.id
        }, { merge: true });
      }
    }
    console.log(`✅ Seeded ${students.length} students`);

    // 2. Seed Mentors
    for (const mu of mentorUsers) {
      await db.collection("users").doc(mu.id).set(mu, { merge: true });
    }
    for (const m of mentors) {
      await db.collection("mentors").doc(m.id).set(m, { merge: true });
    }
    console.log(`✅ Seeded ${mentors.length} mentors`);

    // 3. Seed Teams
    for (const t of teams) {
      await db.collection("teams").doc(t.id).set(t, { merge: true });
    }
    for (const tm of teamMembers) {
      await db.collection("team_members").doc(tm.id).set(tm, { merge: true });
    }
    console.log(`✅ Seeded ${teams.length} teams`);

    // 4. Seed Opportunities
    for (const opp of opportunities) {
      await db.collection("opportunities").doc(opp.id).set(opp, { merge: true });
    }
    console.log(`✅ Seeded ${opportunities.length} opportunities`);

    console.log("🎉 Seed Complete!");
  } catch (error) {
    console.error("❌ Seed Failed:", error);
  } finally {
    process.exit(0);
  }
};

seedData();
