# ENGage agent and decision specification

[Back to the main README](../README.md)

## 1. Purpose and scope

ENGage supports employee onboarding, project reallocation, and knowledge transfer. It turns tracker rows, emails, role updates, access records, activities, and blockers into an evidence-backed answer to one operational question:

> Can this onboarding be closed, and if not, who must do what next?

The governing principle is **the LLM proposes, deterministic rules decide, and a human approves**. An LLM must never set or change `CAN_CLOSE`, `CANNOT_CLOSE`, `NEEDS_INFORMATION`, the assessment colour, the tracker status, or technical readiness. It must never send a message or create a workflow record without a human action.

The implemented prototype includes role dashboards behind a demo sign-in, append-only workflow events, a deterministic readiness assessment, fictional evidence, a Claude Action Advisor with a template fallback, an Evidence Extractor that proposes records from pasted messages, a separate citation-checked analysis for Eva Stone, and human approval records. The Claude features need an API key and have not been run against the live API in this repository.

## 2. Roles and who decides

| Role | Responsibility in the current prototype |
|---|---|
| Employee | Completes work, sends check-ins, reports blockers, finishes tasks, and is the only role allowed to confirm that access is usable. |
| HR | Opens cases, supports staffing, confirms starts, maintains employee descriptions, and uploads CVs. |
| Additional Manager | Requests people from HR, assigns projects and teams, follows onboarding, and reports to Management. |
| Line Manager | Follows local progress, owns practical blockers, and reports to the Additional Manager. |
| Technical Lead | Defines learning, assigns technical tasks, records observed activity levels, and performs the current workflow's technical validation. |
| PMO | Reviews the portfolio, evidence, conflicts, ownership, and follow-up work. PMO does not change the deterministic decision. |
| Management | Reads readiness, risks, delays, staffing requests, and Additional Manager reports. |

`engine.ts` computes the case decision from facts and evidence. In the current workflow, only `TECH_LEAD` may submit a `VALIDATE` event, and a `READY` outcome is rejected unless every recorded activity is `INDEPENDENT`. PMO may review evidence and assign follow-up, but cannot validate technical readiness through the current event rules.

The business owner of the final readiness decision is still an open question between PMO and the Technical Lead. ENGage does not silently resolve that governance question; Section 10 records the temporary implementation assumption.

## 3. Data and evidence model

### 3.1 Case

An onboarding case contains a case ID, employee, start date, movement type (`NEW_HIRE` or `REALLOCATION`), project, manager, tracker status, last-update date, and optional professional direction. The tracker status is a reported value, not proof of final readiness.

### 3.2 Evidence

Each evidence record contains:

- `id`: unique source ID;
- `caseId`: the case it supports;
- `date`;
- `authorRole`;
- `title`;
- `text`: the original source text.

Workflow events create append-only application evidence IDs such as `APP-12`. Existing evidence is never rewritten. Moving an employee to a different project restarts onboarding and clears readiness facts that must not carry into the new assignment.

### 3.3 Facts

Structured facts include access items, observed activities, readiness claims, unanswered requests, blockers, assignment details, reports, tasks, feedback, review date, documents location, and technical validation. Facts keep their supporting evidence IDs where applicable.

### 3.4 Assessment

The deterministic assessment returns:

- `flags`: code, severity, message, and evidence IDs;
- `checklist`: eleven items with `CONFIRMED`, `PARTIAL`, `MISSING`, or `UNKNOWN` state;
- `decision`: `CAN_CLOSE`, `CANNOT_CLOSE`, or `NEEDS_INFORMATION`;
- `colour`: `GREEN`, `RED`, `AMBER`, or `GREY`;
- `actions`: a next-action title, owner role, and related flag code.

### 3.5 Eva Stone demo case

Eva Stone (`ONB-005`, Project Orion) has tracker status **Ready with Support**. `EV-3` says she can handle standard requests with occasional support and has two complex scenarios left. `EV-4` says the Line Manager considers onboarding closed. Both sources remain visible. The engine raises `READINESS_CONFLICT`; it does not merge the statements or treat either one as final proof.

## 4. Agents

The word “agent” describes a bounded component with a defined responsibility. It does not mean that every component uses an LLM.

### 4.1 Evidence Extractor — LLM (Claude), implemented

- **Status:** Implemented in `backend/src/cases/evidence-extractor.ts`, route `POST /cases/:id/extract`, shown to the Additional Manager and Technical Lead as *Paste an email*. Tested with an injected client, not with the live API.
- **Responsibility:** Convert a pasted email or message into proposed workflow records.
- **Input:** The pasted text (1 to 5000 characters), its author role and the allowed record types. The text is untrusted data, not instructions.
- **Output:** `{ source, proposals: [{ type, payload, quote, confidence }], rejected: [{ type, payload, quote, reason }], message }`. Types are `ACCESS`, `ACTIVITY`, `BLOCKER` and `REQUEST_ANSWERED`.
- **Rules:** Propose only; nothing is written. Instructions inside the text are ignored. Every proposal needs a verbatim quote.
- **Interactions:** Every proposal goes through the Evidence Validator before it is shown.
- **Human check:** A person accepts or rejects each proposal; an accepted one is recorded through the normal event flow and its role rules.
- **Limitations:** Text may be ambiguous or incomplete. Without an API key, or on any error, the proposal list is empty with a clear message.

### 4.2 Evidence Validator — code, no LLM, implemented

- **Status:** `backend/src/cases/evidence-validator.ts` checks extractor proposals; `backend/src/onboarding/analysis/analysis.service.ts` checks the Eva Stone analysis.
- **Responsibility:** Ensure that structured model output is correctly shaped, allowed and traceable to its source.
- **Input:** Proposed output, the source text or the case's source records, the acting role and the case facts.
- **Output:** Valid proposals, and rejected ones with a reason.
- **Rules:** Strict Zod schema; the quote must be in the source (extra whitespace ignored for pasted text); credential-like content is rejected; the proposed event must pass the same role rules as a manual record. The analysis path also rejects unknown source IDs. Nothing is "repaired".
- **Interactions:** Sits after the model and before display or human acceptance.
- **Human check:** Passing validation means the quote exists, not that the interpretation is correct.
- **Limitations:** Cannot detect misleading selection, omitted context or a wrong interpretation.

### 4.3 Gap & Conflict Checker and Readiness Assessor — code, implemented

- **Status:** Implemented in `backend/src/rules/engine.ts` and covered by the existing case tests.
- **Responsibility:** Detect operational problems, build the checklist, compute the deterministic decision and colour, and assign rule-based next actions.
- **Input:** One case, its structured facts, its evidence, and the reference date.
- **Output:** Flags, checklist, decision, colour, and next actions with owners.
- **Rules:** Use only the deterministic rules in Section 6. Do not call an LLM or perform I/O. Tracker status alone never closes a case.
- **Interactions:** Receives the current state after append-only workflow events are applied. Its output feeds dashboards and the template advisor.
- **Human check:** People supply and verify the underlying facts. The Technical Lead currently records observed technical validation; PMO and Management review the resulting assessment.
- **Limitations:** Rules depend on complete, correctly structured facts. They cannot understand arbitrary new prose until that prose has been reviewed and converted into facts.

### 4.4 Action Planner / Advisor — Claude with template fallback, implemented

- **Status:** Implemented in `backend/src/cases/advisor.ts`; routes `POST /cases/:id/advice` and `POST /cases/:id/brief` (the *Evidence brief* for PMO, Additional Manager and Technical Lead). Tested with an injected client, not with the live API.
- **Responsibility:** Draft a follow-up message, explain a conflict and say what evidence would change the decision.
- **Input:** Only deterministic flags, checklist items, actions, and the case's evidence IDs and texts.
- **Output:** `{ draft: { to, subject, body }, whatWouldChangeTheDecision, conflictExplanation, citedEvidenceIds, source }`.
- **Rules:** Never modify a case, decision, colour, status, task or readiness. Every cited ID must belong to the case. Missing key, timeout (8 s), invalid JSON, schema failure, bad citation or provider error use the template.
- **Interactions:** Uses the Readiness Assessor output. A person edits the draft; `POST /cases/:id/reviews` records approval or rejection. Sending is simulated.
- **Human check:** The draft is approved or rejected by a person. It is labelled `AI generated (Claude), pending human review` or `Template, not AI generated`.
- **Limitations:** The cited IDs are checked, but the wording of the explanation and draft is not checked against the evidence. The model cannot decide whether onboarding closes.

## 5. Purposeful and responsible LLM use

### 5.1 Where an LLM adds value

An LLM is appropriate for unstructured language tasks: extracting candidate claims from emails, explaining how statements differ in scope, and drafting a clear follow-up from already-computed flags and actions. Eva's “local onboarding closed” versus “two complex scenarios remain” is the main example.

### 5.2 Where an LLM is not used

Dates, missing fields, access state, role permissions, blocker ownership, checklist state, decision logic, colour, and final validation are deterministic policy. Using an LLM for them would make the same facts produce less predictable results.

### 5.3 Minimum data and untrusted input

The Extractor receives only the pasted text, its author role and the allowed record types. The Advisor receives only flags, checklist, actions, and evidence IDs and texts. Source text is treated as untrusted and any instructions inside it are ignored. Credentials must never be sent, logged, committed, or stored.

### 5.4 Validation and fallback

Model output is untrusted. It must pass a strict Zod schema, known-source checks, exact-quote checks where quotes are returned, and credential checks. The advisor must fall back to a deterministic template on missing configuration, error, timeout, invalid JSON, schema failure, or bad citation. The extractor must return no proposals when no model is configured; it must not simulate live extraction unless an example is visibly labelled prerecorded and simulated.

### 5.5 Current model integrations

The Action Advisor and Evidence Extractor call the Anthropic API when `ANTHROPIC_API_KEY` is set (`ANTHROPIC_MODEL` defaults to `claude-sonnet-5-5`). A separate Eva-only evidence analysis is simulated by default and calls the OpenAI Responses API when `OPENAI_API_KEY` and `OPENAI_MODEL` are set. All are advisory and none has been verified with a live key.

## 6. Deterministic rules

### 6.1 Time assumptions and thresholds

- **A-4:** The fixed reference date is `2026-10-14`.
- **A-5:** An unanswered request becomes red when it is more than 3 days old (`days > 3`).
- **A-6:** A tracker status becomes stale when its last update is more than 7 days old (`days > 7`).

Day differences use calendar-day timestamps and are rounded from milliseconds in the current implementation.

### 6.2 Flags and severity

| Flag | Severity | Exact trigger | Default action owner |
|---|---|---|---|
| `ACCESS_NOT_USABLE` | Red | At or after the start date, at least one access item is `NOT_REQUESTED`, `REQUESTED`, or `APPROVED` rather than confirmed usable. | Employee, named access owner, or Line Manager depending on state. |
| `READINESS_CONFLICT` | Red | A non-Technical-Lead claim says `CLOSED_INDEPENDENT` while a Technical Lead claim is not `CLOSED_INDEPENDENT`. | Technical Lead and Additional Manager. |
| `OPEN_BLOCKER` | Red | At least one recorded blocker is unresolved. | Line Manager. |
| `BLOCKED_NO_DETAIL` | Red | Tracker status is `Blocked` but no blocker detail exists. | Line Manager. |
| `UNANSWERED_REQUEST` | Red | A request has no answer and is older than 3 days. | Line Manager. |
| `STALE_STATUS` | Amber | The last tracker update is older than 7 days. | Additional Manager. |
| `MISSING_PROJECT` | Amber | Project is empty. | Additional Manager. |
| `MISSING_MANAGER` | Amber | Manager is empty. | Additional Manager. |
| `STATUS_DATE_MISMATCH` | Amber | Status is `Pre-Onboarding` after the start date. | HR. |
| `NO_REVIEW_DATE` | Amber | The structured facts explicitly record that the final review is not scheduled. | Technical Lead. |
| `NOT_VALIDATED` | Amber | At least one activity is `INDEPENDENT` but not validated by the technical owner, unless a readiness conflict is already raised. | Technical Lead. |

### 6.3 Checklist

The assessor produces these eleven items:

1. Start date and movement type.
2. Project and exact role.
3. Line Manager / Technical Lead / KT Owner.
4. Required applications and permissions.
5. Access requests tracked.
6. KT topics and learning activities.
7. Execution evidence.
8. Expected readiness date.
9. Technical-owner validation.
10. KT documents or folder location.
11. Blockers owned and followed up.

Each item is `CONFIRMED`, `PARTIAL`, `MISSING`, or `UNKNOWN` from explicit code conditions. Technical-owner validation supersedes earlier readiness claims only after the allowed Technical Lead `VALIDATE` event is accepted.

### 6.4 Decision and colour

1. Start with `NEEDS_INFORMATION`.
2. Set `CANNOT_CLOSE` if any red flag exists or any recorded activity is not `INDEPENDENT`.
3. Set `CAN_CLOSE` only when there are no flags, at least one activity exists, every activity is validated by the technical owner, and every checklist item is `CONFIRMED`.
4. Otherwise keep `NEEDS_INFORMATION`.

Colour is `RED` when a red flag exists, `AMBER` when any non-red flag exists, `GREEN` only for `CAN_CLOSE`, and otherwise `GREY`.

When flags exist, their mapped actions are returned. With no flags, the fallback action is to complete every unconfirmed checklist item. After `CAN_CLOSE`, the Additional Manager must still report completion to Management; once that completed report exists, no action remains.

### 6.5 Workflow safeguards

Event types have explicit allowed roles. Only the Employee may set access to `USABLE`. Only the Technical Lead may submit `VALIDATE`. A Line Manager blocker requires an owner and follow-up date. `READY` requires every activity to be `INDEPENDENT`. Password-, API-key-, token-, and similar credential patterns are rejected. Records are appended rather than edited.

## 7. Human checks and boundaries

- A person verifies every extracted claim and its surrounding source context.
- A model suggestion is never written into case facts automatically.
- The deterministic assessment remains visible independently of any model response.
- PMO reviews proposed follow-up and explicitly creates a task or approves/rejects a draft.
- The current Technical Lead validation requires observed activities and an observation note.
- An approved draft is only recorded; message delivery is simulated.
- Analysis failure never hides source evidence or changes the tracker status.
- Model-provider credentials stay server-side and must not appear in frontend configuration, logs, committed files, prompts, evidence, or runtime records.

## 8. Limitations and what is simulated

- All employees, cases, emails, CVs, and activity records are fictional hackathon data.
- The sign-in is a demo entry door: it decides which dashboard is shown, but the API does not check it and trusts the role sent by the client. Role checks are workflow constraints, not production security.
- Without `DATABASE_URL` the data is JSON seed data plus a local state file. It is not designed for concurrent production use.
- PostgreSQL has been run locally with the main workflow; it is not tested under concurrent use.
- Staffing, notifications, message delivery, and external integrations are mocked or simulated.
- Without an Anthropic key the Action Advisor uses its template and the Evidence Extractor proposes nothing.
- The Claude paths have been tested only with injected clients, not against the live API.
- The Eva-only evidence analysis is simulated by default; its optional live model path has not been verified.
- Exact-quote validation proves that words occur in a source, not that a claim is a fair interpretation.
- No credentials are stored. Real employee data and sensitive documents must not be used.
- Docker Compose and a public deployment are not currently verified.

## 9. Setup and how to run

### 9.1 Default local demo

Requirements: Node.js and npm. From the repository root on Windows PowerShell:

```powershell
.\start.ps1
```

This installs missing dependencies, builds the backend, starts both services, and opens <http://localhost:5173>. No database or model key is needed.

Manual startup uses two PowerShell windows.

Backend:

```powershell
npm.cmd ci --prefix backend
npm.cmd run build --prefix backend
npm.cmd run start --prefix backend
```

Frontend:

```powershell
npm.cmd ci --prefix frontend
npm.cmd run dev --prefix frontend
```

The frontend uses `VITE_API_URL`, defaulting to `http://localhost:3000`. The API listens on port 3000 unless `PORT` is set. Default changes are saved to `backend/runtime/state.json`; stop the backend and remove that file to reset the demo.

### 9.2 Tests

```powershell
npm.cmd run build --prefix backend
npm.cmd run test:engage --prefix backend
npm.cmd run test:analysis --prefix backend
npm.cmd run test:follow-ups --prefix backend
npm.cmd run test:advisor --prefix backend
npm.cmd run test:extractor --prefix backend
npm.cmd run build --prefix frontend
```

A real key goes only into `backend/.env`, which Git ignores. The sign-in and PostgreSQL steps are in the [README](../README.md).

## 10. Assumptions and open questions

- **A-1 — Evidence over status:** A tracker status is a report, not final proof of readiness.
- **A-2 — Observed execution:** Final readiness requires observed work, especially independent execution of required activities.
- **A-3 — Human approval:** Model outputs are proposals. A permitted human records workflow changes and reviews drafts.
- **A-4 — Reference date:** Rule evaluation uses `2026-10-14` for the fixed hackathon dataset.
- **A-5 — Unanswered threshold:** More than 3 days without an answer is a red issue.
- **A-6 — Stale threshold:** More than 7 days without a tracker update is an amber issue.
- **A-7 — Additional Manager hierarchy:** Organisers verbally clarified that the Additional Manager is a peer of the Technical Lead and both report to the Line Manager. The current UI/reporting implementation is not fully consistent with that clarification: it routes Technical Lead reports to the Line Manager, Line Manager reports to the Additional Manager, and Additional Manager reports to Management. This must be confirmed before production rules are finalised.
- **A-8 — Final-readiness owner is unresolved:** The organisers have not settled whether PMO or the Technical Lead owns the final business decision. The current workflow is unchanged: only the Technical Lead records technical validation, the deterministic engine computes the case decision, and PMO reviews evidence and follow-up. This is an implementation assumption, not a final governance decision.
- **A-9 — Safe degradation:** If a model is absent or fails, deterministic rules and original evidence remain available. The advisor uses its template; the extractor returns no proposals.

Any change to A-7 or A-8 must be reflected in role permissions, reporting flow, tests, UI language, and this specification together.
