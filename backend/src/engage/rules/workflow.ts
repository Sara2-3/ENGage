// The onboarding workflow: which role may record what, and how each record changes the case.
// Records are never edited; the current state is the seed data plus all records in order.
import { DIRECTIONS, type Evidence, type Facts, type Level, type OnboardingCase, type AccessState } from './types';

export type EventType =
  | 'ASSIGN' | 'CONFIRM_START' | 'PLAN' | 'ACTIVITY' | 'ACCESS' | 'BLOCKER'
  | 'RESOLVE_BLOCKER' | 'REQUEST_ANSWERED' | 'VALIDATE' | 'NEXT_STEP' | 'REPORT' | 'CHECKIN' | 'REQUIREMENT' | 'PROFILE';

export interface NewEvent {
  type: EventType;
  actorRole: string;
  payload: Record<string, any>;
}
export interface CaseEvent extends NewEvent {
  id: number;
  caseId: string;
  date: string;
}

export const ALLOWED: Record<EventType, string[]> = {
  ASSIGN: ['HR'],
  CONFIRM_START: ['HR'],
  PLAN: ['TECH_LEAD'],
  ACTIVITY: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'TECH_LEAD'],
  ACCESS: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'TECH_LEAD'],
  BLOCKER: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'TECH_LEAD'],
  RESOLVE_BLOCKER: ['ADDITIONAL_MANAGER', 'TECH_LEAD'],
  REQUEST_ANSWERED: ['ADDITIONAL_MANAGER', 'TECH_LEAD'],
  VALIDATE: ['TECH_LEAD'],
  NEXT_STEP: ['ADDITIONAL_MANAGER', 'TECH_LEAD'],
  REPORT: ['ADDITIONAL_MANAGER', 'TECH_LEAD'],
  CHECKIN: ['EMPLOYEE'],
  REQUIREMENT: ['ADDITIONAL_MANAGER'],
  PROFILE: ['HR'],
};

export const REPORT_STATUSES = ['ON_TRACK', 'NEEDS_HELP', 'COMPLETED'];

const LEVELS: Level[] = ['NOT_COVERED', 'SHADOWING', 'SUPPORTED', 'INDEPENDENT'];
const ACCESS: AccessState[] = ['NOT_REQUESTED', 'REQUESTED', 'APPROVED', 'USABLE'];
const OUTCOMES = ['READY', 'READY_WITH_SUPPORT', 'PARTIALLY_READY'];
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 500;
const list = (v: unknown) => (Array.isArray(v) ? v.filter(filled).map((x) => x.trim()) : []);
const SECRET = /(password|passwd|fjalëkalim|api[_ -]?key|token)\s*[:=]/i;

// Returns an error message, or null when the record is acceptable.
export function validateEvent(e: NewEvent, facts: Facts): string | null {
  const p = e.payload ?? {};
  if (!ALLOWED[e.type]) return 'Unknown action.';
  if (!ALLOWED[e.type].includes(e.actorRole)) return `This role cannot record ${e.type}.`;
  if (SECRET.test(JSON.stringify(p))) return 'Do not store passwords or credentials.';
  switch (e.type) {
    case 'ASSIGN':
      return ['project', 'role', 'lineManager', 'techLead', 'ktOwner'].some((k) => filled(p[k]))
        ? null : 'Fill in at least one assignment field.';
    case 'PLAN':
      return list(p.activities).length || list(p.systems).length || filled(p.reviewDate) || filled(p.docsLocation)
        ? null : 'Add activities, systems, a review date or a documents location.';
    case 'ACTIVITY':
      return filled(p.name) && LEVELS.includes(p.level) ? null : 'Activity name and level are required.';
    case 'ACCESS':
      if (!filled(p.system) || !ACCESS.includes(p.state)) return 'System and state are required.';
      return p.state === 'USABLE' && e.actorRole !== 'EMPLOYEE'
        ? 'Only the employee can confirm that a system is usable.' : null;
    case 'BLOCKER':
      return filled(p.description) ? null : 'Describe the blocker.';
    case 'RESOLVE_BLOCKER':
      if (!(facts.blockers ?? []).some((b) => !b.resolved)) return 'There is no open blocker.';
      return filled(p.note) ? null : 'Say how it was resolved.';
    case 'REQUEST_ANSWERED':
      if (!(facts.requests ?? []).some((r) => !r.answeredOn)) return 'There is no unanswered request.';
      return filled(p.note) ? null : 'Record the answer.';
    case 'VALIDATE': {
      if (typeof p.sufficient !== 'boolean' || !filled(p.note)) return 'Decision and observation note are required.';
      if (!p.sufficient) return null;
      if (!OUTCOMES.includes(p.outcome)) return 'Choose a readiness outcome.';
      const activities = facts.activities ?? [];
      if (!activities.length) return 'Record the observed activities first.';
      if (p.outcome === 'READY' && activities.some((a) => a.level !== 'INDEPENDENT'))
        return 'Ready needs every activity recorded as independent.';
      return null;
    }
    case 'REQUIREMENT':
      return filled(p.text) ? null : 'Write what is required.';
    case 'PROFILE':
      if (p.direction && !DIRECTIONS.includes(p.direction)) return 'Unknown direction.';
      return filled(p.description) ? null : 'Write a short description.';
    case 'CHECKIN':
      return filled(p.note) ? null : 'Write a short check-in.';
    case 'REPORT':
      return REPORT_STATUSES.includes(p.status) && filled(p.note) ? null : 'Status and a short note are required.';
    case 'NEXT_STEP':
      return filled(p.title) && filled(p.owner) ? null : 'Action and owner are required.';
    default:
      return null;
  }
}

const describe = (e: CaseEvent): string => {
  const p = e.payload;
  switch (e.type) {
    case 'ASSIGN': return ['project', 'role', 'lineManager', 'techLead', 'ktOwner']
      .filter((k) => filled(p[k])).map((k) => `${k}: ${p[k]}`).join(', ');
    case 'CONFIRM_START': return 'Start date and movement type confirmed; onboarding started.';
    case 'PLAN': return [
      list(p.activities).length ? `Activities: ${list(p.activities).join(', ')}` : '',
      list(p.systems).length ? `Systems: ${list(p.systems).join(', ')}` : '',
      p.reviewDate ? `Readiness review: ${p.reviewDate}` : '',
      p.docsLocation ? `Documents at: ${p.docsLocation}` : '',
    ].filter(Boolean).join('. ');
    case 'ACTIVITY': return `${p.name}: ${p.level}`;
    case 'ACCESS': return `${p.system}: ${p.state}${p.owner ? `, owner ${p.owner}` : ''}`;
    case 'BLOCKER': return `Blocker: ${p.description}`;
    case 'RESOLVE_BLOCKER': return `Blocker resolved: ${p.note}`;
    case 'REQUEST_ANSWERED': return `Request answered: ${p.note}`;
    case 'VALIDATE': return p.sufficient
      ? `Validated as ${p.outcome}. ${p.note}` : `Evidence not sufficient yet. ${p.note}`;
    case 'CHECKIN': return `Employee check-in: ${p.note}`;
    case 'REQUIREMENT': return `Additional Manager requires: ${p.text}`;
    case 'PROFILE': return `HR description${p.direction ? ` (${p.direction})` : ''}: ${p.description}`;
    case 'REPORT': return `Report to Line Manager: ${p.status}. ${p.note}`;
    case 'NEXT_STEP': return `${p.title} (owner: ${p.owner}${p.due ? `, due ${p.due}` : ''})`;
  }
};

export function applyEvents(base: OnboardingCase, seedFacts: Facts, events: CaseEvent[]) {
  const c: OnboardingCase = { ...base };
  const f: Facts = structuredClone(seedFacts);
  const evidence: Evidence[] = [];

  for (const e of events) {
    const p = e.payload;
    f.details ??= {};
    f.access ??= [];
    f.activities ??= [];
    f.blockers ??= [];
    const evidenceId = `APP-${e.id}`;

    switch (e.type) {
      case 'ASSIGN':
        // Moving to another project starts onboarding again: earlier readiness does not carry over.
        if (filled(p.project) && c.project && p.project !== c.project) {
          c.movement = 'REALLOCATION';
          c.trackerStatus = 'Pre-Onboarding';
          c.startDate = e.date;
          c.manager = null;
          f.details = {};
          f.access = [];
          f.activities = [];
          f.blockers = [];
          f.reports = [];
          delete f.readinessClaims;
          delete f.requests;
          delete f.reviewNotScheduled;
          delete f.validation;
          delete f.startConfirmed;
        }
        for (const k of ['role', 'lineManager', 'techLead', 'ktOwner'] as const) {
          if (filled(p[k])) f.details[k] = p[k];
        }
        if (filled(p.project)) c.project = p.project;
        if (filled(p.lineManager)) c.manager = p.lineManager;
        break;
      case 'REQUIREMENT':
        f.details.requirement = p.text;
        break;
      case 'PROFILE':
        f.details.description = p.description;
        if (filled(p.direction)) c.direction = p.direction;
        break;
      case 'REPORT':
        (f.reports ??= []).push({ role: e.actorRole, status: p.status, note: p.note, date: e.date });
        break;
      case 'CONFIRM_START':
        f.startConfirmed = true;
        if (c.trackerStatus === 'Pre-Onboarding') c.trackerStatus = 'Started';
        break;
      case 'PLAN':
        for (const name of list(p.activities)) {
          if (!f.activities.some((a) => a.name === name)) {
            f.activities.push({ name, level: 'NOT_COVERED', validatedByTechOwner: false, evidenceIds: [evidenceId] });
          }
        }
        for (const system of list(p.systems)) {
          if (!f.access.some((a) => a.system === system)) {
            f.access.push({ system, state: 'NOT_REQUESTED', note: 'Identified in the plan', requestedOn: null, owner: null, nextFollowUp: null, evidenceIds: [evidenceId] });
          }
        }
        if (filled(p.reviewDate)) {
          f.details.reviewDate = p.reviewDate;
          delete f.reviewNotScheduled;
        }
        if (filled(p.docsLocation)) f.details.docsLocation = p.docsLocation;
        break;
      case 'ACTIVITY': {
        const next = { name: p.name, level: p.level as Level, validatedByTechOwner: false, evidenceIds: [evidenceId] };
        const i = f.activities.findIndex((a) => a.name === p.name);
        if (i < 0) f.activities.push(next);
        else f.activities[i] = { ...next, evidenceIds: [...f.activities[i].evidenceIds, evidenceId] };
        break;
      }
      case 'ACCESS': {
        let item = f.access.find((a) => a.system === p.system);
        if (!item) {
          item = { system: p.system, state: 'NOT_REQUESTED', note: '', requestedOn: null, owner: null, nextFollowUp: null, evidenceIds: [] };
          f.access.push(item);
        }
        item.state = p.state;
        item.note = `Updated by ${e.actorRole}`;
        if (p.state === 'REQUESTED') item.requestedOn ??= e.date;
        if (filled(p.owner)) item.owner = p.owner;
        if (filled(p.nextFollowUp)) item.nextFollowUp = p.nextFollowUp;
        item.evidenceIds.push(evidenceId);
        break;
      }
      case 'BLOCKER':
        f.blockers.push({ description: p.description, owner: p.owner || null, nextFollowUp: p.nextFollowUp || null, resolved: false, evidenceId });
        break;
      case 'RESOLVE_BLOCKER':
        for (const b of f.blockers) b.resolved = true;
        if (c.trackerStatus === 'Blocked') c.trackerStatus = 'In progress';
        break;
      case 'REQUEST_ANSWERED':
        for (const r of f.requests ?? []) r.answeredOn ??= e.date;
        break;
      case 'VALIDATE':
        if (p.sufficient) {
          // The technical owner's validation supersedes earlier readiness claims (SPEC 6.3).
          f.validation = { outcome: p.outcome, date: e.date, evidenceId };
          delete f.readinessClaims;
          for (const a of f.activities) a.validatedByTechOwner = true;
          c.trackerStatus = p.outcome === 'READY' ? 'Ready'
            : p.outcome === 'READY_WITH_SUPPORT' ? 'Ready with Support' : 'Partially Ready';
        }
        break;
    }

    // Assigning people or planning a follow-up is not new information about progress.
    if (e.type !== 'NEXT_STEP' && e.type !== 'ASSIGN' && e.type !== 'REPORT' && e.type !== 'REQUIREMENT' && e.type !== 'PROFILE') c.lastUpdate = e.date;
    evidence.push({ id: evidenceId, caseId: e.caseId, date: e.date, authorRole: e.actorRole, title: e.type, text: describe(e) });
  }
  return { case: c, facts: f, evidence };
}

export function stages(c: OnboardingCase, f: Facts) {
  const activities = f.activities ?? [];
  return [
    { title: 'Assigned to project', done: Boolean(c.project) },
    { title: 'Start confirmed', done: Boolean(f.startConfirmed) || c.trackerStatus !== 'Pre-Onboarding' },
    { title: 'Learning plan', done: activities.length > 0 },
    { title: 'Doing the activities', done: activities.some((a) => a.level !== 'NOT_COVERED' && a.level !== 'UNKNOWN') },
    { title: 'Technical Lead confirmed', done: Boolean(f.validation) },
  ];
}
