# 🚀 Codovate — Redefine Your Potential

> **The career acceleration ecosystem built specifically for ambitious students.**

[![GitHub](https://img.shields.io/badge/GitHub-RatiPatil%2FCodovate__Prod-blue?logo=github)](https://github.com/RatiPatil/Codovate_Prod)
[![Branch](https://img.shields.io/badge/Branch-main-green)](https://github.com/RatiPatil/Codovate_Prod/tree/main)
[![Database](https://img.shields.io/badge/Database-Cloud%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Auth](https://img.shields.io/badge/Auth-Firebase%20Authentication-orange?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 🌟 About Codovate

**We believe that talent is everywhere, but opportunities are not.**

Codovate bridges the opportunity gap for students, providing the roadmaps, mentorship, verified opportunities, and tools they need to stand out globally. Discover internships, build competitive technical profiles, apply with one click, and track applications in real time — all within a unified platform.

---

## ⚡ Core Platform Capabilities

| Feature | Description |
|---|---|
| 🎯 **Student Profile & Strength Meter** | Comprehensive academic profile, dynamic skill tags, career goals, and portfolio/resume links with auto-completion scoring. |
| 💼 **Opportunity Hub** | Live marketplace for jobs, internships, hackathons, and career events with search, filtering, and skill-matching heuristics. |
| 📝 **Seamless Application Tracking** | Apply to opportunities with strict duplicate protection (409 Conflict), UID ownership isolation, and live status lifecycles. |
| 🔔 **Real-Time Notifications** | Instant alerts via Socket.io for application submissions, status updates, and peer networking. |
| 🛡️ **Role-Based Access Control (RBAC)** | Strict Firestore security rules and token-verified middleware protecting student data privacy. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19, Vite
- **Styling**: Tailwind CSS
- **Icons & Visuals**: Lucide React, Custom SVGs
- **Real-Time**: Socket.io Client
- **Testing**: Vitest, React Testing Library, JSDOM

### Backend
- **Runtime**: Node.js, Express
- **Real-Time**: Socket.io
- **Database**: Google Cloud Firestore (`codovateprod`)
- **Authentication**: Firebase Authentication (ID Token verification via Firebase Admin SDK)
- **Storage**: Firebase Storage (`codovateprod.appspot.com`)
- **Testing**: Jest, Supertest

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/RatiPatil/Codovate_Prod.git
cd Codovate_Prod
```

### 2. Setup & Run the Backend
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` with Socket.io real-time support.*

### 3. Setup & Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Testing & Validation

### Run Frontend Tests
```bash
cd frontend
npm run test
```

### Run Backend Integration Tests
```bash
cd backend
npm test
```

### Build for Production
```bash
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>© 2026 Codovate. Designed for builders.</strong>
</p>
