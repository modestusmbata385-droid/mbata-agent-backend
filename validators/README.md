# Mbata Agent — Full-Stack Skeleton

Structural scaffold for the Mbata Agent blueprint (v2.0): Node.js/Express
backend + React (Vite) frontend, PostgreSQL database. **No business logic
is implemented yet** — every route returns `501 Not Implemented`, every
page is a placeholder. This is Phase 1 groundwork so real features
(Phase 2 onward) have a consistent structure to land in.

## Structure

```
mbata-agent/
├── backend/
│   ├── config/        # env.js, db.js (pg pool), schema.sql
│   ├── routes/        # one router per API module, stubbed
│   ├── controllers/   # one controller file per module, empty
│   ├── services/      # business logic layer (empty, see README)
│   ├── models/        # data access layer (empty, see README)
│   ├── middleware/     # auth, permissions, error handling, rate limiting
│   ├── validators/    # input validation schemas (empty)
│   ├── permissions/   # role/permission rule tables (empty)
│   ├── utils/ jobs/ notifications/ ai/  # supporting layers (empty)
│   ├── uploads/       # local file storage target
│   ├── app.js          # Express app + route mounting
│   └── server.js       # entry point
│
└── frontend/
    └── src/
        ├── pages/       # auth/ dashboard/ finance/ business/ boss/ driver/ tenant/ education/
        ├── layouts/     # AppShell (header + sidebar + content)
        ├── components/  # shared components (ModuleGate = Section 9 pattern)
        ├── services/    # api.js — shared axios client
        ├── hooks/ state/ utils/ assets/  # empty, ready for use
        └── App.jsx      # route table
```

## Running it locally

**1. Database**

```bash
docker compose up -d postgres
```

This starts Postgres and loads `backend/config/schema.sql` on first boot
(core `users`, `profiles`, session/OTP, and `audit_logs` tables — see
Section 27/28 of the blueprint for the full target schema).

**2. Backend**

```bash
cd backend
cp .env.example .env   # fill in DB + JWT secrets
npm install
npm run dev             # http://localhost:4000, health check at /health
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to :4000
```

## What's intentionally NOT here yet

Per the blueprint's own phase plan (Section 41), this skeleton stops
before any logic:

- No OTP generation/verification, hashing, or JWT issuance (Phase 2)
- No profile creation logic (Phase 3)
- No finance/business/boss/education calculations (Phases 4–7)
- No AI context engine (Phase 8)
- No design system, dark/light theme, or mobile drawer nav (Phase 9)
- No tests yet beyond the `tests/README.md` outline (Phase 10)

Each empty backend folder (`services/`, `models/`, `validators/`,
`permissions/`, `utils/`, `jobs/`, `notifications/`, `ai/`) has its own
`README.md` describing what belongs there and pointing back to the
relevant blueprint section.

