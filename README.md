# Worqube

**Placement portal for the Training & Placement cell at Pune Institute of Computer Technology (PICT).**

Students build a placement profile, see which drives they're eligible for, apply with one click and track every application. T&P coordinators post drives, filter students, move applicants through shortlisting and selection, and see live placement statistics.

## Features

**Students**
- Profile: academics (branch, year, CGPA, backlogs), skills, projects, experience, certifications, coding profiles
- Resume upload (PDF, stored privately; only the student and T&P admins can open it)
- Job board with automatic eligibility checks (minimum CGPA, eligible branches, backlog limit, deadline), with the reason shown when a student isn't eligible
- One-click apply, application tracking, withdraw while pending

**T&P admins**
- Placement overview: students, open drives, applications, offers, placement rate, charts by branch and outcome
- Student directory with search and filters (branch, year, CGPA range), full profile view
- Post, edit, close and delete drives; applicants per drive with resume links, status updates and CSV export

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| Backend | Node.js, Express 5, Mongoose, Zod validation |
| Database | MongoDB (Atlas in production); resumes in GridFS |
| Auth | JWT in an httpOnly, SameSite cookie; bcrypt password hashing; role-based access |
| Tests | Node's built-in test runner + `mongodb-memory-server` (20 API tests) |
| Hosting | Render (single web service), MongoDB Atlas |

## Architecture

```
worqube/
├── client/   React app (Vite). In development /api is proxied to the server.
└── server/   Express API. In production it also serves client/dist.
    ├── src/models       User (with embedded profile), Company, Job, Application
    ├── src/routes       auth, profile, jobs, applications, admin, public
    ├── src/lib          eligibility rules, resume storage (GridFS), validation helpers
    ├── scripts/seed.js  demo data + admin/student accounts
    └── test/            API tests against an in-memory MongoDB
```

One origin serves both the app and the API, so the session cookie never crosses sites.

### Security

- Students can't make themselves admins: sign-up always creates a student, and roles are set only by the seed script.
- Every route checks the role on the server; eligibility is enforced when applying, not only shown in the UI.
- Input is validated with Zod; Mongo query operators in user input are rejected.
- Resumes are checked to be real PDFs (≤ 5 MB) and served only to their owner and admins.
- Helmet (including a Content Security Policy), rate limiting on login/sign-up and the API, and a refusal to start in production with a weak `JWT_SECRET`.

## Run it locally

Requirements: Node.js 20.19+.

```bash
npm run install:all
```

**Quickest: demo mode** (no database setup; an in-memory MongoDB with seed data, reset on exit)

```bash
npm run dev:demo      # API on :5000, prints demo logins
npm run dev:web       # in a second terminal: app on http://localhost:8080
```

**With your own MongoDB**

```bash
cp server/.env.example server/.env   # set MONGO_URI and JWT_SECRET
npm run seed                          # creates demo data and logins (saved to accounts.local.csv, gitignored)
npm run dev:api
npm run dev:web
```

Run the tests with `npm test`.

## Deploy (Render + MongoDB Atlas)

1. In Atlas, allow connections from anywhere (`0.0.0.0/0`), since Render's free tier has no fixed IP, and copy the connection string with `/worqube` as the database name.
2. Seed the database once from your machine: put that string in `server/.env` and run `npm run seed`.
3. On Render choose **New → Blueprint**, pick this repository, and paste the connection string as `MONGO_URI` when asked. `render.yaml` sets the build/start commands, health check (`/api/health`) and generates `JWT_SECRET`.

The free tier sleeps after 15 minutes without traffic; the first request then takes about 30 seconds.

## Author

**Bhavarth Petare** · GitHub [@BhavarthPetare](https://github.com/BhavarthPetare)
