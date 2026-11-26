# ENGage

Team ONYX's employee onboarding and knowledge-transfer prototype for the Engineering Albania Student Hackathon. It shows what is happening in each onboarding, what is missing or blocked, which evidence supports the status, and who should do what next.

**Stack:** React with Vite (JavaScript) in `frontend/`, NestJS (TypeScript) in `backend/`, PostgreSQL optional.

## Start

Needs Node.js 22 or newer. On Windows, double-click `start.cmd` (or run `.\start.ps1`). It installs dependencies the first time, builds the backend, starts both servers and opens <http://localhost:5173>.

By hand, install once:

```powershell
npm.cmd ci --prefix backend; npm.cmd ci --prefix frontend
```

Then the backend in one terminal:

```powershell
npm.cmd run build --prefix backend; npm.cmd run start --prefix backend
```

and the frontend in a second one:

```powershell
npm.cmd run dev --prefix frontend
```

No database or API key is needed. Without a database, everything entered is saved in `backend/runtime/state.json` and survives restarts; to reset the demo, stop the backend and delete that file. `start` runs the built code: rebuild after changing the backend.

A practical guide in Albanian: [docs/UDHEZUESI.md](docs/UDHEZUESI.md).

## Sign in

Usernames: `pmo`, `management`, `additional`, `linemanager`, `techlead`, `employee`, `hr`. All share one password, which is not stored in the code or in Git: the backend creates `backend/runtime/password.txt` with a random value on first use, or takes `ENGAGE_PASSWORD`. The role buttons under the sign-in form fill it in.

Each user sees only their own role's dashboard, with a side menu of its pages. This is a **demo entry door, not security**: the API does not check the login.

## Roles, in order of seniority

| Role | What they do |
|---|---|
| PMO | Reads one overview, by project and by employee. Technical Lead work is not shown. |
| Management | Reads the Additional Manager's reports and sees what is at risk. |
| Additional Manager | Asks HR for people, assigns projects and teams, reports to Management. |
| Line Manager | Follows progress, removes practical blockers, reports to the Additional Manager. |
| Technical Lead | Gives technical tasks, sets the learning plan, validates readiness, reports to the Line Manager. |
| Employee | Sees profile, CV, projects, tasks and reviews; confirms access works. |
| HR (support) | Finds or registers the requested person, writes descriptions, uploads CVs. |

**Practical blocker:** something concrete that stops a person from working (missing access, an unanswered request, an unexplained "Blocked"). It gets an owner and a follow-up date and is followed to closure. A learning gap is not a blocker; it belongs to the Technical Lead.

## Demo journey

Sign out and sign in again to change role.

1. **Additional Manager** → *Ask HR* → *Ask HR for people*: New hire, Java, project Atlas.
2. **HR** → *Requests*: enter a fictional name and start date → *Send to Additional Manager*.
3. **Additional Manager** → *Assign projects* → *Assign project*.
4. **Technical Lead** → choose the person → *Assign task*; *Open case* → *Record an update* → *Set the learning plan*.
5. **Employee** → pick the person → *My work* → *It works*; *My profile* → *Mark as done*.
6. **Technical Lead** → *Open case* → *Record an update*: *Record activity progress* (Independent), then *Review evidence and decide*; report to the Line Manager.
7. **Line Manager** → *Blockers*: follow a blocker to closure; *Progress* → report to the Additional Manager.
8. **Additional Manager** → *Report to Management*.
9. **Management** and **PMO** see the result.

For a case with conflicting evidence, open Eva Stone (`ONB-005`): the Technical Lead and the Line Manager disagree.

## What is real and what is simulated

- Problems, next actions and the close decision come from **fixed rules** (`backend/src/rules`), not from AI.
- Specification of every component, the decision and the use of AI: [docs/AGENT_SPEC.md](docs/AGENT_SPEC.md).
- The evidence analysis for Eva Stone is **simulated** unless `OPENAI_API_KEY` and `OPENAI_MODEL` are set; then a real model is called (not yet run against the live API). Follow-up messages are **templates** that a person approves. Nothing is sent.
- All people and data are fictional. Cases and evidence come from the starter pack; professional directions, descriptions, CVs, contacts, tasks, reports and reviews were added by the team.
- Do not store passwords or credentials; common patterns are rejected.

## Demo data

With the backend running, this adds fictional reports, reviews, requirements, tasks, project contacts and requests to HR, so that no page is empty. It is safe to run twice.

```powershell
npm.cmd run demo:data --prefix backend
```

## Optional PostgreSQL

Create `backend/.env` (ignored by Git) with your own password; characters such as `@ : / # ?` must be URL-encoded:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/engage
```

Stop the backend, then build, set up the database and start again:

```powershell
npm.cmd run build --prefix backend
```

```powershell
npm.cmd run db:setup --prefix backend
```

```powershell
npm.cmd run start --prefix backend
```

`db:setup` creates the database and tables, and copies what was saved in `runtime/state.json` into an empty database. The same `.env` can hold `PORT`, `ENGAGE_PASSWORD`, `OPENAI_API_KEY` and `OPENAI_MODEL`. The frontend calls <http://localhost:3000> unless `VITE_API_URL` is set in `frontend/.env`.

## Project structure

```
backend/src/
  auth/  cases/  staffing/  onboarding/  health/   module, controller, service, DTO/, Entity/
  database/    PostgreSQL, file or memory storage
  rules/       the deterministic rules and the workflow
  Helper/
frontend/src/
  Pages/       one folder per dashboard, and the login
  components/  shared parts of the dashboards
  Context/     signed-in user, cases, requests to HR
  Services/    calls to the API, ProtectedRoute
  Helper/  db/  assets/
```

## Tests

```powershell
npm.cmd run build --prefix backend
npm.cmd run test:engage --prefix backend
npm.cmd run test:analysis --prefix backend
npm.cmd run test:follow-ups --prefix backend
npm.cmd run build --prefix frontend
```

## Also in the repository

The earlier Streamlit prototype (`py -m pip install -r requirements.txt`, then `py -m streamlit run app.py`) and the [development log](docs/DEVELOPMENT_LOG.md).
