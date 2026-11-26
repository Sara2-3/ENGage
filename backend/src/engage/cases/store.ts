// Combines stored data, workflow records and the rules engine.
import { addCase, addEvent, addStaffing, fillStaffing, markAssigned, readCvIds, readData, readReviews, readStaffing, type Data, type StaffingSpecs } from '../db/repository';
import { assess, AS_OF } from '../rules/engine';
import type { OnboardingCase } from '../rules/types';
import { applyEvents, stages, validateEvent, type NewEvent } from '../rules/workflow';

function evaluate(base: OnboardingCase, data: Data) {
  const applied = applyEvents(base, data.facts[base.id] ?? {}, data.events.filter((e) => e.caseId === base.id));
  const evidence = [...data.evidence.filter((e) => e.caseId === base.id), ...applied.evidence];
  return { case: applied.case, facts: applied.facts, evidence, assessment: assess(applied.case, applied.facts, evidence) };
}

export async function getCase(id: string) {
  const data = await readData();
  const base = data.cases.find((x) => x.id === id);
  if (!base) return null;
  const { case: c, facts, evidence, assessment } = evaluate(base, data);
  return {
    asOf: AS_OF,
    case: c,
    hasCv: (await readCvIds()).has(id),
    details: facts.details ?? {},
    evidence,
    access: facts.access ?? [],
    activities: facts.activities ?? [],
    blockers: facts.blockers ?? [],
    reports: facts.reports ?? [],
    stages: stages(c, facts),
    assessment,
    reviews: await readReviews(id),
  };
}

// Every case with its details, for the role dashboards.
export async function overview() {
  const data = await readData();
  const cvs = await readCvIds();
  return data.cases.map((base) => {
    const { case: c, facts, evidence, assessment } = evaluate(base, data);
    return {
      case: c,
      hasCv: cvs.has(c.id),
      details: facts.details ?? {},
      evidence,
      access: facts.access ?? [],
      activities: facts.activities ?? [],
      blockers: facts.blockers ?? [],
      reports: facts.reports ?? [],
      stages: stages(c, facts),
      assessment,
    };
  });
}

export async function listCases() {
  const data = await readData();
  return data.cases
    .map((base) => {
      const { case: c, assessment } = evaluate(base, data);
      return {
        id: c.id,
        employee: c.employee,
        movement: c.movement,
        project: c.project,
        startDate: c.startDate,
        manager: c.manager,
        status: c.trackerStatus,
        lastUpdate: c.lastUpdate,
        issues: assessment.flags.map((f) => f.code),
        colour: assessment.colour,
        decision: assessment.decision,
        label: assessment.flags[0]?.label
          ?? (assessment.decision === 'CAN_CLOSE' ? 'Ready to close' : 'Not enough evidence'),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

// Records one workflow step. Returns an error message, or null when saved.
export async function record(id: string, event: NewEvent): Promise<string | null> {
  const data = await readData();
  const base = data.cases.find((x) => x.id === id)!;
  const error = validateEvent(event, evaluate(base, data).facts);
  if (!error) await addEvent(id, event, AS_OF);
  return error;
}

// Opens a new case (workflow steps 1 to 3).
export async function openCase(input: Pick<OnboardingCase, 'employee' | 'movement' | 'startDate' | 'project' | 'direction'>, description?: string) {
  const data = await readData();
  const next = Math.max(...data.cases.map((c) => Number(c.id.slice(4)))) + 1;
  const created: OnboardingCase = {
    id: `ONB-${String(next).padStart(3, '0')}`,
    ...input,
    manager: null,
    trackerStatus: 'Pre-Onboarding',
    lastUpdate: AS_OF,
  };
  await addCase(created);
  // Every employee starts with a description; HR can change it later.
  const where = created.project ? `project ${created.project}` : 'a new project';
  const text = description?.trim() || (created.movement === 'NEW_HIRE'
    ? `New hire${created.direction ? ` in the ${created.direction} direction` : ''}, joining ${where}.`
    : `You are moving to ${where}.`);
  await addEvent(created.id, { type: 'PROFILE', actorRole: 'HR', payload: { description: text } }, AS_OF);
  return created;
}

// Management asks HR for people; HR fills the request with an employee (team flow).
export const listStaffing = readStaffing;

export async function requestStaff(project: string, need: string, specs: StaffingSpecs) {
  await addStaffing(project, need, specs, AS_OF);
}

export async function fillRequest(requestId: number, caseId: string): Promise<string | null> {
  const request = (await readStaffing()).find((x) => x.id === requestId);
  if (!request || request.status !== 'OPEN') return 'This request is not open.';
  if (request.specs.type === 'NEW_HIRE') return 'This request is for a new hire. Register the new person instead.';
  const detail = await getCase(caseId);
  if (!detail) return 'Unknown employee.';
  const { movement, project } = detail.case;
  if (movement !== 'REALLOCATION' && project) return 'Only reallocations or people without a project can be proposed.';
  if (project === request.project) return 'This person is already on that project.';
  await fillStaffing(requestId, caseId);
  return null;
}

// A new-hire request is filled by registering the person. Management assigns the project afterwards.
export async function hireForRequest(requestId: number, employee: string, startDate: string): Promise<string | null> {
  const request = (await readStaffing()).find((x) => x.id === requestId);
  if (!request || request.status !== 'OPEN') return 'This request is not open.';
  if (request.specs.type !== 'NEW_HIRE') return 'This request is for someone already in the company.';
  const created = await openCase({ employee, movement: 'NEW_HIRE', startDate, project: null, direction: request.specs.direction ?? null });
  await fillStaffing(requestId, created.id);
  return null;
}

export interface Assignment {
  project: string;
  role: string;
  lineManager: string;
  techLead: string;
  ktOwner: string;
}

// Management puts a person on a project and names their team; onboarding starts from here.
export async function assignPerson(caseId: string, to: Assignment, requestId?: number): Promise<string | null> {
  const detail = await getCase(caseId);
  if (!detail) return 'Unknown employee.';
  const request = requestId ? (await readStaffing()).find((x) => x.id === requestId) : undefined;
  if (requestId && (request?.caseId !== caseId || request.specs.assigned)) return 'This request is not waiting for an assignment.';
  const error = await record(caseId, { type: 'ASSIGN', actorRole: 'MANAGEMENT', payload: { ...to } });
  if (error) return error;
  await addEvent(caseId, { type: 'CONFIRM_START', actorRole: 'HR', payload: {} }, AS_OF);
  const { movement, direction } = detail.case;
  const moved = Boolean(detail.case.project) && detail.case.project !== to.project;
  const description = movement === 'NEW_HIRE' && !moved
    ? `New hire${direction ? ` in the ${direction} direction` : ''}, joining project ${to.project} as ${to.role}.`
    : `You are moving to project ${to.project} as ${to.role}.`;
  await addEvent(caseId, { type: 'PROFILE', actorRole: 'HR', payload: { description } }, AS_OF);
  if (requestId) await markAssigned(requestId);
  return null;
}
