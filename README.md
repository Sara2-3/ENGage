# ENGage

ENGage is Team ONYX's employee onboarding prototype for the Engineering Albania Student Hackathon. It helps a PMO Coordinator review what each onboarding source reports, identify missing evidence, and decide who should take the next action. The PMO Coordinator is the primary demo user because this role brings together evidence from the employee, Line Manager, and Technical Lead and coordinates follow-up.

## What works today

The current Streamlit prototype opens Eva Stone's onboarding case for Project Orion (`ONB-005`). A teammate can:

- see the tracker-reported status, **Ready with Support**;
- open the Technical Lead and Line Manager source emails; and
- review the evidence gap, missing final technical confirmation, and suggested next action.

The data is fictional and stored locally in `data/evidence.json`. The Streamlit app does not save changes or call an AI service.

The repository also has the current React/NestJS implementation:

- a React and TypeScript PMO case page in `frontend/`;
- a NestJS and TypeScript API in `backend/`; and
- a PostgreSQL schema and idempotent seed for Eva's case and evidence.

The React page loads `ONB-005` from `GET /onboarding/cases/:caseId`, displays the reported tracker status and both source emails, and explains why final technical readiness still needs review. `GET /health` continues to run `SELECT 1` through the PostgreSQL connection supplied in `DATABASE_URL`.

## Run the current prototype

From the repository root in Windows PowerShell:

```powershell
py -m pip install -r requirements.txt
py -m streamlit run app.py
```

If your Windows installation exposes Python as `python` instead of `py`:

```powershell
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Streamlit prints the local browser URL after startup. The root `requirements.txt` lists the legacy prototype's Python dependency.

## Run the React, NestJS, and PostgreSQL stack

Prerequisites are Node.js with npm and a running PostgreSQL instance. From the repository root in Windows PowerShell, install the locked dependencies:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Configure the current PowerShell session after replacing the placeholder values with credentials for an existing local PostgreSQL database:

```powershell
$env:DATABASE_URL = "postgresql://engage_user:change_me@localhost:5432/engage"
```

Create the tables and seed the fictional demo data. The seed can be run repeatedly; `ONB-005` remains one case with two evidence records.

```powershell
npm.cmd run db:schema --prefix backend
npm.cmd run db:seed --prefix backend
npm.cmd run db:seed --prefix backend
```

Start the backend in the same PowerShell window so it retains `DATABASE_URL`:

```powershell
npm.cmd run start:dev --prefix backend
```

In a second PowerShell window, from the repository root, start the frontend:

```powershell
$env:VITE_API_URL = "http://localhost:3000"
npm.cmd run dev --prefix frontend
```

Open `http://localhost:5173`. The PMO view should show Eva Stone, Project Orion, `ONB-005`, **Reported status: Ready with Support**, two expandable email records, and the **Technical review needed** note. It shows a loading state while requesting the case, a not-found state for an unknown or unseeded case, and an unavailable state when the API or database cannot be reached.

In a third PowerShell window, verify the API responses:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/onboarding/cases/ONB-005
try {
    Invoke-WebRequest http://localhost:3000/onboarding/cases/UNKNOWN -UseBasicParsing
} catch {
    $_.Exception.Response.StatusCode.value__
}
```

The first two requests should succeed, and the unknown case check should print `404`.

Example configuration is available in `backend/.env.example` and `frontend/.env.example`. Do not commit real credentials. The PowerShell commands above set the variables for the current terminal session; the backend keeps `DATABASE_URL` server-side.

Build both applications from the repository root with:

```powershell
npm.cmd run build --prefix backend
npm.cmd run build --prefix frontend
```

## Target stack and deployment

The target product stack is React with TypeScript, NestJS with TypeScript, PostgreSQL, OpenAI, and Docker. The React/NestJS/PostgreSQL case flow is implemented locally. OpenAI integration, follow-up task assignment, full Docker Compose setup, and deployment are not implemented. No deployment provider or verified public demo URL is recorded in the repository.

See [Development Log](docs/DEVELOPMENT_LOG.md) for the workflow, target architecture, verified build history, and next steps.
