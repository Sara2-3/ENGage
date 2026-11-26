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
- a PostgreSQL schema for Eva's case, evidence, and persistent follow-up tasks.

The React page loads `ONB-005` from `GET /onboarding/cases/:caseId`, displays the reported tracker status and both source emails, and explains why final technical readiness still needs review. The PMO Coordinator can request an on-demand, source-linked OpenAI analysis and assign one persistent open technical review without changing the tracker status. `GET /health` continues to run `SELECT 1` through the PostgreSQL connection supplied in `DATABASE_URL`.

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
$env:OPENAI_API_KEY = "replace_with_your_openai_api_key"
$env:OPENAI_MODEL = "replace_with_a_structured_output_model"
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

Click **Analyze evidence** to call `POST /onboarding/cases/ONB-005/analyze`. The result shows source-linked findings and exact quotes, followed by **What still needs verification** and **Suggested next action**. The output is an AI-generated suggestion for PMO review; the Technical Lead remains responsible for final technical readiness. The original emails and tracker status remain visible if analysis fails.

In **Technical review task**, review or edit the description and click **Assign technical review**. This works without running OpenAI; when analysis is available, its suggested action prefills the editable description. The saved task shows the **Technical Lead** assignee and **Open** status. Refresh the page to confirm the task is loaded from PostgreSQL. Repeated submissions return the existing open technical review and do not overwrite its description.

In a third PowerShell window, verify the API responses:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/onboarding/cases/ONB-005
$taskBody = @{
    description = "Ask the Technical Lead to review the two complex scenarios and record what Eva can perform independently."
} | ConvertTo-Json
$firstTask = Invoke-RestMethod `
    -Method Post `
    -ContentType "application/json" `
    -Body $taskBody `
    http://localhost:3000/onboarding/cases/ONB-005/follow-ups
$secondTask = Invoke-RestMethod `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"description":"This must not replace the existing description."}' `
    http://localhost:3000/onboarding/cases/ONB-005/follow-ups
$firstTask.taskId -eq $secondTask.taskId
Invoke-RestMethod http://localhost:3000/onboarding/cases/ONB-005/follow-ups
try {
    Invoke-WebRequest http://localhost:3000/onboarding/cases/UNKNOWN -UseBasicParsing
} catch {
    $_.Exception.Response.StatusCode.value__
}
```

The health and case requests should succeed. The two POST requests should return the same task ID, the comparison should print `True`, the GET should show one open technical review, and the unknown case check should print `404`.

Example configuration is available in `backend/.env.example` and `frontend/.env.example`. Do not commit real credentials. The PowerShell commands above set the variables for the current terminal session; the backend keeps `DATABASE_URL` and `OPENAI_API_KEY` server-side.

Build both applications from the repository root with:

```powershell
npm.cmd run build --prefix backend
npm.cmd run build --prefix frontend
```

Run the mocked backend citation checks after building the backend:

```powershell
npm.cmd run build --prefix backend
npm.cmd run test:analysis --prefix backend
npm.cmd run test:follow-ups --prefix backend
```

The analysis tests accept a valid source-linked analysis and reject unknown source IDs and quotes that are not present in the cited email. The follow-up tests confirm that an existing open task is returned without replacing its description and that an empty description is rejected before database access.

## Target stack and deployment

The target product stack is React with TypeScript, NestJS with TypeScript, PostgreSQL, OpenAI, and Docker. The React/NestJS/PostgreSQL case flow, on-demand OpenAI evidence analysis, and persistent technical-review assignment are implemented locally. Full Docker Compose setup and deployment are not implemented and belong to Step 6. No deployment provider or verified public demo URL is recorded in the repository.

See [Development Log](docs/DEVELOPMENT_LOG.md) for the workflow, target architecture, verified build history, and next steps.
