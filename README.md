# ENGage

Team ONYX's employee onboarding and knowledge-transfer prototype for the Engineering Albania Student Hackathon. It shows what is happening in each onboarding, what is missing or blocked, which evidence supports the status, and who should do what next.

## Start

Needs Node.js. On Windows, double-click `start.cmd` (or run `.\start.ps1`). It installs dependencies the first time, builds the backend, starts both servers and opens <http://localhost:5173>.

By hand, in two terminals:

```powershell
npm.cmd ci --prefix backend; npm.cmd ci --prefix frontend
npm.cmd run build --prefix backend; npm.cmd run start --prefix backend
npm.cmd run dev --prefix frontend
```

No database or API key is needed. Everything entered is saved in `backend/runtime/state.json` and survives restarts. To reset the demo, stop the backend and delete that file. `start` runs the built code: rebuild after changing the backend.

A practical guide in Albanian: [docs/UDHEZUESI.md](docs/UDHEZUESI.md).

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

1. **Additional Manager** → *Ask HR for people*: New hire, Java, project Atlas.
2. **HR** → *New hires*: enter a fictional name and start date → *Send to Additional Manager*.
3. **Additional Manager** → *Waiting for a project* → *Assign project*.
4. **Technical Lead** → *Assign task*; *Open case* → *Record an update* → *Set the learning plan*.
5. **Employee** → *My work* → *It works*; *My profile* → *Mark as done*.
6. **Technical Lead** → *Record activity progress* (Independent), then *Review evidence and decide*; report to the Line Manager.
7. **Line Manager** → remove a blocker (for example Theo Park), then report to the Additional Manager.
8. **Additional Manager** → *Report to Management*.
9. **Management** and **PMO** see the result.

For a case with conflicting evidence, open Eva Stone (`ONB-005`): the Technical Lead and the Line Manager disagree.

## What is real and what is simulated

- Problems, next actions and the close decision come from **fixed rules** (`backend/src/engage/rules`), not from AI.
- Specification of every component, the decision and the use of AI: [docs/AGENT_SPEC.md](docs/AGENT_SPEC.md).
- The evidence analysis for Eva Stone is **simulated** unless `OPENAI_API_KEY` and `OPENAI_MODEL` are set; then a real model is called (not yet run against the live API). Follow-up messages are **templates** that a person approves. Nothing is sent.
- All people and data are fictional. Cases and evidence come from the starter pack; professional directions, descriptions, CVs, tasks and reviews were added by the team.
- There is **no login**. Roles are chosen on screen and the server trusts the role it is told, so role limits are not security.
- Do not store passwords or credentials; common patterns are rejected.

## Tests

```powershell
npm.cmd run build --prefix backend
npm.cmd run test:engage --prefix backend
npm.cmd run test:analysis --prefix backend
npm.cmd run test:follow-ups --prefix backend
npm.cmd run build --prefix frontend
```

## Optional PostgreSQL

Set `DATABASE_URL` before starting the backend; it creates its tables and seeds missing rows. This mode has not been verified against the latest features.

## Also in the repository

The earlier Streamlit prototype (`py -m pip install -r requirements.txt`, then `py -m streamlit run app.py`) and the [development log](docs/DEVELOPMENT_LOG.md).
