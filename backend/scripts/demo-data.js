// Fills the screens for a demo with fictional reports, reviews, requirements, tasks and requests.
// Run while the backend is running:  npm run demo:data
// It goes through the API, so the usual rules apply. Safe to run twice: what exists is skipped.
// Only record types that do not count as a progress update are used, so the findings of the
// rules engine (stale status, missing access, open topics) stay as they are.
const API = process.env.API_URL || 'http://localhost:3000';

async function call(path, body) {
  const res = await fetch(`${API}${path}`, body && {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

const reports = [
  ['TECH_LEAD', 'ONB-005', 'NEEDS_HELP', 'Standard requests are covered; two complex scenarios are still open.'],
  ['TECH_LEAD', 'ONB-010', 'ON_TRACK', 'Daily activities are going well; exceptions and production changes are still to be observed.'],
  ['TECH_LEAD', 'ONB-007', 'ON_TRACK', 'Shadowing has started; the activities still need to be named.'],
  ['LINE_MANAGER', 'ONB-002', 'NEEDS_HELP', 'Access to the project tools is not confirmed as usable yet.'],
  ['LINE_MANAGER', 'ONB-004', 'ON_TRACK', 'Knowledge transfer has started; a current update will follow.'],
  ['LINE_MANAGER', 'ONB-006', 'ON_TRACK', 'Has the training guide; the start still needs to be confirmed.'],
  ['ADDITIONAL_MANAGER', 'ONB-002', 'NEEDS_HELP', 'Project work cannot begin until the employee confirms the tools work.'],
  ['ADDITIONAL_MANAGER', 'ONB-005', 'NEEDS_HELP', 'The complex scenarios need coverage and a review date.'],
  ['ADDITIONAL_MANAGER', 'ONB-009', 'NEEDS_HELP', 'Project role and knowledge-transfer owner are still to be confirmed.'],
  ['ADDITIONAL_MANAGER', 'ONB-004', 'ON_TRACK', 'Handover is in progress.'],
];

// case, what the Additional Manager requires, first technical task (needs a project)
const people = [
  ['ONB-001', 'Angular basics and the Aurora web interfaces.', 'Read the Aurora interface overview'],
  ['ONB-002', 'Working access to the Nimbus tools before any project work.', 'Try each project tool and report which ones work'],
  ['ONB-003', '.NET support skills; the project is still to be decided.', null],
  ['ONB-004', 'Able to take over the Helios project work step by step.', 'Shadow one handover session and write down open questions'],
  ['ONB-005', 'Handle Orion requests, including the complex scenarios.', null],
  ['ONB-006', 'SAP knowledge and use of the Atlas runbook.', null],
  ['ONB-007', 'Learn the Nova activities by shadowing, then with support.', 'List the Nova activities you have shadowed'],
  ['ONB-008', 'Microsoft Dynamics use and extensions on Pulse.', 'Walk through one Dynamics extension with the team'],
  ['ONB-009', 'A confirmed project, role and knowledge-transfer owner.', null],
  ['ONB-010', 'Daily activities, then exceptions and production changes.', null],
];

const reviews = [
  ['TECH_LEAD', 'ONB-001', 'GOOD', 'Asks clear questions during the first sessions.'],
  ['LINE_MANAGER', 'ONB-002', 'GOOD', 'Reported the access problem early.'],
  ['LINE_MANAGER', 'ONB-003', 'GOOD', 'Prepared well while waiting for a project.'],
  ['TECH_LEAD', 'ONB-004', 'GOOD', 'Follows the handover sessions closely.'],
  ['TECH_LEAD', 'ONB-006', 'GOOD', 'Started reading the training guide.'],
  ['TECH_LEAD', 'ONB-007', 'GOOD', 'Takes useful notes while shadowing.'],
  ['LINE_MANAGER', 'ONB-008', 'GOOD', 'Communicates blockers clearly.'],
  ['LINE_MANAGER', 'ONB-009', 'GOOD', 'Keeps following up on the open questions.'],
  ['TECH_LEAD', 'ONB-010', 'VERY_GOOD', 'Handles the daily activities with confidence.'],
];

// Fictional contacts for the people on a project. The Manager already recorded is kept; where none
// is recorded it stays missing, so that finding is still shown.
const teams = {
  'ONB-001': ['Dana Brook', 'Kim Lowe'], 'ONB-002': ['Sam Quill', 'Jordan Pike'],
  'ONB-004': ['Dana Brook', 'Kim Lowe'], 'ONB-005': ['Sam Quill', 'Jordan Pike'],
  'ONB-006': ['Dana Brook', 'Kim Lowe'], 'ONB-007': ['Sam Quill', 'Jordan Pike'],
  'ONB-008': ['Dana Brook', 'Kim Lowe'], 'ONB-010': ['Sam Quill', 'Jordan Pike'],
};

// Line Manager report and review for everyone who has none yet.
const lineNotes = {
  'ONB-001': 'First sessions are taking place.', 'ONB-003': 'Waiting for a project to be assigned.',
  'ONB-005': 'Local follow-up is continuing.', 'ONB-007': 'Shadowing sessions are taking place.',
  'ONB-008': 'Following up on practical needs.', 'ONB-009': 'Open questions are being followed up.',
  'ONB-010': 'Taking part in the daily work.',
};

const requests = [
  { project: 'Helios', need: 'Support analyst', type: 'REALLOCATION', skills: 'Incident handling, SQL', level: 'MID' },
  { project: 'Atlas', need: 'Junior SAP consultant', type: 'NEW_HIRE', direction: 'SAP', skills: 'SAP basics', level: 'JUNIOR' },
];

async function main() {
  const cases = new Map((await call('/cases/overview')).map((c) => [c.case.id, c]));
  let added = 0;
  const record = async (id, actorRole, type, payload) => {
    await call(`/cases/${id}/events`, { type, actorRole, payload });
    added += 1;
  };

  for (const [role, id, status, note] of reports) {
    const c = cases.get(id);
    if (c && !c.reports.some((r) => r.role === role)) await record(id, role, 'REPORT', { status, note });
  }
  for (const [id, requirement, task] of people) {
    const c = cases.get(id);
    if (!c) continue;
    if (!c.details.requirement) await record(id, 'ADDITIONAL_MANAGER', 'REQUIREMENT', { text: requirement });
    if (task && c.case.project && !c.tasks.length) await record(id, 'TECH_LEAD', 'TASK', { title: task });
  }
  for (const [role, id, rating, text] of reviews) {
    const c = cases.get(id);
    if (c && !c.feedback.length) await record(id, role, 'REVIEW', { rating, text });
  }
  for (const [id, [techLead, ktOwner]] of Object.entries(teams)) {
    const c = cases.get(id);
    if (!c || !c.case.project || c.details.techLead || c.details.ktOwner) continue;
    await record(id, 'ADDITIONAL_MANAGER', 'ASSIGN', { techLead, ktOwner, ...(c.case.manager && { lineManager: c.case.manager }) });
  }
  for (const c of (await call('/cases/overview'))) {
    const id = c.case.id;
    const note = lineNotes[id] ?? 'Local follow-up is continuing.';
    if (!c.reports.some((r) => r.role === 'LINE_MANAGER')) {
      await record(id, 'LINE_MANAGER', 'REPORT', { status: 'ON_TRACK', note });
    }
    if (!c.feedback.some((r) => r.role === 'LINE_MANAGER')) {
      await record(id, 'LINE_MANAGER', 'REVIEW', { rating: 'GOOD', text: note });
    }
  }

  const asked = await call('/staffing');
  for (const r of requests) {
    if (asked.some((s) => s.project === r.project && s.need === r.need)) continue;
    await call('/staffing', { actorRole: 'ADDITIONAL_MANAGER', startDate: '2026-11-02', notes: '', ...r });
    added += 1;
  }
  console.log(`Demo data: ${added} records added.`);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
