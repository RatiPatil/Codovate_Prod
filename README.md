# Codovate

Codovate is a robust, multi-tenant application serving students, college admins, company recruiters, mentors, and super admins.

## Tech Stack
- **Frontend:** React + Vite, Tailwind CSS, GSAP for animations.
- **Backend:** Node.js, Express, Socket.io (Real-time updates).
- **Database:** Firebase (Firestore & Authentication).

## Project Structure
```text
Codovate/
├── frontend/             # React application
│   ├── src/
│   ├── package.json
│   └── .env.example      # Template for local env vars
├── backend/              # Node.js application
│   ├── routes/           # Express API endpoints
│   ├── config/           # Firebase configuration
│   ├── package.json
│   └── .env.example      # Template for local env vars
├── README.md             # This file
└── CONTRIBUTING.md       # Guidelines for developers
```

## Installation Steps
### Prerequisites
- Node.js (v18+)
- NPM or Yarn
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd codovate
```

### 2. Move to the Developer Branch
Never develop directly on `main`. Always switch to the `developer` branch.
```bash
git checkout developer
git pull origin developer
```

### 3. Environment Setup
You need separate `.env` files for the frontend and backend.
- Copy `frontend/.env.example` to `frontend/.env`.
- Copy `backend/.env.example` to `backend/.env`.
- Obtain the necessary Firebase Development Keys and JWT secret from your Team Lead.

*Ensure you have the `serviceAccountKey.json` inside the `backend/config/` directory. Do not commit this file!*

### 4. Running the Project Locally
Open two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run start
```
*The backend will run on http://localhost:5000*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on http://localhost:5173*

## Development Guidelines
- Read `CONTRIBUTING.md` for branching, committing, and code review rules.
- Connect exclusively to the **Development** Firebase database to avoid polluting production data.
- If you make schema changes, communicate with the Team Lead.
