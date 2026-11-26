# ENGage

ENGage is Team ONYX's employee onboarding prototype for the Engineering Albania Student Hackathon. It gives a PMO Coordinator one place to review onboarding evidence, understand what still needs verification, and assign a technical follow-up without changing the reported tracker status or the Technical Lead's responsibility for final readiness.

## Default local demo

The default demo requires no PostgreSQL instance, `DATABASE_URL`, OpenAI key, or external service. NestJS serves local fixtures through the same API routes used by the full application.

The React PMO view includes:

- Eva Stone, Project Orion, case `ONB-005`;
- reported status **Ready with Support**;
- Email 3 from the Technical Lead and Email 4 from the Line Manager;
- deterministic, source-linked **Simulated analysis** with exact quotes;
- an editable **Assign technical review** workflow; and
- one in-memory open task assigned to the Technical Lead.

The task remains visible after a browser refresh while the backend process is running. Restarting the backend resets the in-memory task.

## Run the React and NestJS demo on Windows

Prerequisite: Node.js with npm.

From the repository root in Windows PowerShell, install the locked dependencies:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Start the backend with no environment variables required:

```powershell
npm.cmd run start:dev --prefix backend
```

In a second PowerShell window, from the repository root, start the frontend:

```powershell
npm.cmd run dev --prefix frontend
```

Open `http://localhost:5173`.

## Try the demo

1. Confirm Eva Stone, Project Orion, `ONB-005`, and **Reported status: Ready with Support** are visible.
2. Expand Email 3 and Email 4 and review the original text.
3. Click **Analyze evidence**. Confirm the result is labeled **Simulated analysis** and shows findings, exact quotes, the evidence gap, and the suggested technical review.
4. Review or edit the task description and click **Assign technical review**.
5. Confirm the task shows **Technical Lead** and **Open**.
6. Refresh the browser and confirm the task is still visible.
7. Restart the backend and refresh again to reset the in-memory task.

The API can also be checked directly from PowerShell:

```powershell
$health = Invoke-RestMethod http://localhost:3000/health
$case = Invoke-RestMethod http://localhost:3000/onboarding/cases/ONB-005
$analysis = Invoke-RestMethod `
    -Method Post `
    http://localhost:3000/onboarding/cases/ONB-005/analyze

$taskBody = @{
    description = "Ask the Technical Lead to review the two scenarios and record what Eva can perform independently."
} | ConvertTo-Json

$firstTask = Invoke-RestMethod `
    -Method Post `
    -ContentType "application/json" `
    -Body $taskBody `
    http://localhost:3000/onboarding/cases/ONB-005/follow-ups

$repeatedTask = Invoke-RestMethod `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"description":"This must not replace the existing task."}' `
    http://localhost:3000/onboarding/cases/ONB-005/follow-ups

$savedTasks = Invoke-RestMethod `
    http://localhost:3000/onboarding/cases/ONB-005/follow-ups

$health
$case
$analysis
$firstTask.taskId -eq $repeatedTask.taskId
$savedTasks
```

The health response should report `status: ok`, `dataSource: mock`, and `mockData: ready`. Both task submissions should return the same task ID and preserve the first description.

## Build and test

From the repository root:

```powershell
npm.cmd run build --prefix backend
npm.cmd run build --prefix frontend
npm.cmd run test:analysis --prefix backend
npm.cmd run test:follow-ups --prefix backend
```

## Optional PostgreSQL mode

The PostgreSQL schema and seed scripts remain available for development. To use them, configure `DATABASE_URL`, apply the schema and seed, then start the backend in the same PowerShell session:

```powershell
$env:DATABASE_URL = "postgresql://engage_user:change_me@localhost:5432/engage"
npm.cmd run db:schema --prefix backend
npm.cmd run db:seed --prefix backend
npm.cmd run start:dev --prefix backend
```

When `DATABASE_URL` is absent, the backend automatically uses mock fixtures and in-memory follow-up storage. The current demo never requires or reads OpenAI credentials.

## Legacy Streamlit prototype

The earlier Streamlit prototype remains runnable:

```powershell
py -m pip install -r requirements.txt
py -m streamlit run app.py
```

## Target stack and deployment

The target product stack remains React with TypeScript, NestJS with TypeScript, PostgreSQL, OpenAI, and Docker. The current local demo uses deterministic analysis instead of a live model and has not been deployed. Docker Compose, live OpenAI integration, and deployment remain future work.

See [Development Log](docs/DEVELOPMENT_LOG.md) for the workflow, architecture, build history, and verification record.
