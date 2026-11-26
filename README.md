# ENGage

Team ONYX's employee onboarding and knowledge-transfer prototype for the Engineering Albania Student Hackathon. It shows what is happening in each onboarding, what is missing or blocked, which evidence supports the status, and who should do what next.

**Stack:** React 19 with Vite in `frontend/`, NestJS 11 with TypeScript in `backend/`, PostgreSQL for durable data, deterministic business rules, and optional server-side Claude/OpenAI analysis.

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

## Technical architecture

ENGage uses a simple layered architecture. The browser displays role-specific workflows, the API coordinates the use cases, deterministic rules make readiness decisions, and PostgreSQL stores the records. AI is a constrained assistant: it proposes structured information or wording, but code validates it and a person decides whether to save it.

> **Core principle:** the LLM proposes, the rules decide, and a human approves.

```mermaid
flowchart LR
    U[Role-based users] --> UI[React + Vite frontend]
    UI -->|HTTP + JSON| API[NestJS API]

    subgraph Backend
        API --> AUTH[Auth module<br/>demo sign-in]
        API --> CASES[Cases module<br/>case workflow and evidence]
        API --> STAFF[Staffing module<br/>requests and assignments]
        API --> ONB[Onboarding module<br/>analysis and follow-ups]

        CASES --> RULES[Deterministic rules engine]
        STAFF --> STORE[Repository and storage layer]
        ONB --> STORE
        RULES --> STORE

        CASES --> AI[Claude proposals<br/>extractor and advisor]
        ONB -. optional .-> OAI[Simulated or OpenAI analysis]
        AI --> VALIDATE[Zod, quote, source ID,<br/>credential and role validation]
        OAI --> VALIDATE
    end

    STORE --> DB[(PostgreSQL)]
    STORE -. zero-configuration fallback .-> FILE[JSON seed + runtime state]
    VALIDATE --> HUMAN[Human review]
    HUMAN -->|Accept or approve| API
```

### Responsibilities by layer

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | React, Vite | Shows the correct dashboard for each role, collects input, and clearly separates reported status, evidence, rule decisions, and AI suggestions. |
| API | NestJS controllers and DTOs | Exposes typed endpoints, validates requests, applies role restrictions, and coordinates services. |
| Application services | Cases, Staffing, Onboarding, Auth | Implements use cases such as staffing requests, project assignment, evidence review, follow-up tasks, and approval records. |
| Business rules | `backend/src/rules/` | Computes flags, checklist state, next actions, readiness decision, and colour. It is deterministic and never calls an LLM. |
| AI assistance | Claude through server-side `fetch`; optional OpenAI analysis | Extracts proposed events, explains evidence conflicts, and drafts follow-up wording. It cannot close a case, change a status, or write directly to storage. |
| Validation | Zod plus plain TypeScript checks | Rejects invalid schemas, unknown evidence IDs, non-verbatim quotes, credentials, and events that the acting role cannot record. |
| Persistence | PostgreSQL through the repository layer | Stores cases, facts, append-only events, evidence, staffing requests, reviews, CVs, and follow-up tasks. Local file storage remains available for a zero-configuration demo. |

### Data and decision flow

Normal workflow updates follow one predictable path:

```text
Role action -> React form -> NestJS endpoint -> DTO/workflow validation
            -> append-only event -> PostgreSQL -> deterministic reassessment -> refreshed UI
```

The tracker status is preserved as a reported value. The rules engine independently evaluates the supporting facts and evidence, so a status such as **Ready with Support** cannot close a case by itself.

### AI flow A: extract evidence from an email

1. The Additional Manager or Technical Lead pastes an email in the selected case.
2. React calls `POST /cases/:id/extract`; only the pasted text, author role, and allowed event shapes are sent to Claude.
3. Claude returns proposed `ACCESS`, `ACTIVITY`, `BLOCKER`, or `REQUEST_ANSWERED` events with exact quotes and confidence values.
4. Backend code validates the Zod schema, quote, credential patterns, role permission, and current case facts.
5. Valid and rejected proposals are returned separately. Nothing has been saved yet.
6. A human accepts one proposal; only then does React call the existing event endpoint and the rules engine reassesses the case.

### AI flow B: build an evidence brief

1. PMO, Additional Manager, or Technical Lead requests `POST /cases/:id/brief`.
2. The rules engine supplies the evidence, flags, unknown checklist items, actions, and owners.
3. Claude only phrases the conflict explanation, “What would change the decision?”, and a follow-up draft.
4. The backend validates the response and every cited evidence ID. Invalid or unavailable AI output falls back to a deterministic template.
5. The user reviews the original sources and approves or rejects the draft. **Sending is simulated; only the review decision is recorded.**

### Why this design is feasible

- **Predictable:** business decisions remain deterministic and covered by tests.
- **Traceable:** every issue and AI statement links back to evidence IDs and original text.
- **Safe by default:** model keys and database credentials stay in `backend/.env`; the frontend never receives them.
- **Resilient:** PostgreSQL is the durable store, while local fixtures and runtime state keep the demo usable without infrastructure.
- **Modular:** frontend pages, NestJS modules, rules, AI clients, validation, and persistence can evolve independently.
- **Human-controlled:** no AI path changes readiness, closes a case, sends a message, or writes an event automatically.

The current deployment is local for the hackathon demo. The same API boundaries support a hosted React frontend, NestJS service, and managed PostgreSQL database without changing the business workflow.

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
6. **Technical Lead** → *Open case* → *Record an update*: *Record activity progress* (Independent); back on the dashboard *Validate readiness*; report to the Line Manager.
7. **Line Manager** → *Blockers*: follow a blocker to closure; *Progress* → report to the Additional Manager.
8. **Additional Manager** → *Report to Management*.
9. **Management** and **PMO** see the result.

For a case with conflicting evidence, open Eva Stone (`ONB-005`): the Technical Lead and the Line Manager disagree.

## What is real and what is simulated

- Problems, next actions and the close decision come from **fixed rules** (`backend/src/rules`), not from AI.
- Specification of every component, the decision and the use of AI: [docs/AGENT_SPEC.md](docs/AGENT_SPEC.md).
- The evidence analysis for Eva Stone is **simulated** unless `OPENAI_API_KEY` and `OPENAI_MODEL` are set; then a real model is called (not yet run against the live API). Follow-up messages are **templates** that a person approves. Nothing is sent.
- **Claude (optional):** with `ANTHROPIC_API_KEY` set (in `backend/.env`; `ANTHROPIC_MODEL` defaults to `claude-sonnet-5-5`), the *Evidence brief* on a case words the conflict explanation and the draft message, and *Paste an email* proposes records that a person accepts one by one. Without a key the brief uses a template and nothing is extracted. Not run against the live API in the tests. Longer specification: [docs/SPEC.md](docs/SPEC.md).
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
npm.cmd run test:advisor --prefix backend
npm.cmd run test:extractor --prefix backend
npm.cmd run build --prefix frontend
```

## Also in the repository

The earlier Streamlit prototype (`py -m pip install -r requirements.txt`, then `py -m streamlit run app.py`) and the [development log](docs/DEVELOPMENT_LOG.md).
