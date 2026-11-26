// Deterministic rules (SPEC.md section 6). No LLM, no I/O.
import type {
  Assessment, CheckState, ChecklistItem, Colour, Decision, Evidence, Facts, Flag,
  NextAction, OnboardingCase, Severity,
} from './types';

export const AS_OF = '2026-10-14'; // A-4
const STALE_DAYS = 7; // A-6
const UNANSWERED_DAYS = 3; // A-5

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function findFlags(c: OnboardingCase, facts: Facts, asOf = AS_OF): Flag[] {
  const flags: Flag[] = [];
  const add = (code: string, severity: Severity, label: string, message: string, evidenceIds: string[] = []) =>
    flags.push({ code, severity, label, message, evidenceIds });

  const blockedAccess = (facts.access ?? []).filter((a) => a.state === 'NOT_REQUESTED' || a.state === 'REQUESTED' || a.state === 'APPROVED');
  if (blockedAccess.length && asOf >= c.startDate) {
    add('ACCESS_NOT_USABLE', 'RED', 'Access missing',
      `Not confirmed usable: ${blockedAccess.map((a) => a.system).join(', ')}.`,
      [...new Set(blockedAccess.flatMap((a) => a.evidenceIds))]);
  }

  const claims = facts.readinessClaims ?? [];
  const closed = claims.filter((x) => x.role !== 'TECH_LEAD' && x.claim === 'CLOSED_INDEPENDENT');
  const technical = claims.filter((x) => x.role === 'TECH_LEAD' && x.claim !== 'CLOSED_INDEPENDENT');
  const conflict = closed.length > 0 && technical.length > 0;
  if (conflict) {
    add('READINESS_CONFLICT', 'RED', 'Conflicting updates',
      'The Line Manager considers onboarding closed; the Technical Lead says topics are still open.',
      [...technical, ...closed].map((x) => x.evidenceId));
  }

  const open = (facts.blockers ?? []).filter((b) => !b.resolved);
  if (open.length) {
    add('OPEN_BLOCKER', 'RED', 'Open blocker',
      `Open blocker: ${open.map((b) => `${b.description} (owner: ${b.owner ?? 'unassigned'})`).join('; ')}.`,
      open.map((b) => b.evidenceId));
  }

  if (c.trackerStatus === 'Blocked' && !facts.blockers?.length) {
    add('BLOCKED_NO_DETAIL', 'RED', 'Blocked, no reason',
      'The tracker says Blocked, but no reason or owner is recorded.');
  }

  for (const r of facts.requests ?? []) {
    if (!r.answeredOn && days(r.sentOn, asOf) > UNANSWERED_DAYS) {
      add('UNANSWERED_REQUEST', 'RED', 'No reply',
        `No reply for ${days(r.sentOn, asOf)} days: ${r.what}.`, [r.evidenceId]);
    }
  }

  const age = days(c.lastUpdate, asOf);
  if (age > STALE_DAYS) {
    add('STALE_STATUS', 'AMBER', 'Outdated status',
      `"${c.trackerStatus}" was last updated ${age} days ago and may not be true.`);
  }
  if (!c.project) add('MISSING_PROJECT', 'AMBER', 'No project', 'No project is recorded.');
  if (!c.manager) add('MISSING_MANAGER', 'AMBER', 'No manager', 'No manager is recorded.');
  if (c.trackerStatus === 'Pre-Onboarding' && asOf > c.startDate) {
    add('STATUS_DATE_MISMATCH', 'AMBER', 'Not started?',
      'Still Pre-Onboarding although the start date has passed.');
  }
  if (facts.reviewNotScheduled) {
    add('NO_REVIEW_DATE', 'AMBER', 'No review date',
      'No date for the final readiness review.', [facts.reviewNotScheduled.evidenceId]);
  }

  const unvalidated = (facts.activities ?? []).filter((a) => a.level === 'INDEPENDENT' && !a.validatedByTechOwner);
  if (unvalidated.length && !conflict) {
    add('NOT_VALIDATED', 'AMBER', 'Not validated',
      'Independence is self-reported and not validated by the technical owner.',
      [...new Set(unvalidated.flatMap((a) => a.evidenceIds))]);
  }
  return flags;
}

export function buildChecklist(c: OnboardingCase, facts: Facts, evidence: Evidence[], flags: Flag[]): ChecklistItem[] {
  const access = facts.access ?? [];
  const activities = facts.activities ?? [];
  const d = facts.details ?? {};
  const requested = access.some((a) => a.requestedOn);
  const tracked = access.length > 0
    && access.every((a) => a.state === 'USABLE' || (a.requestedOn && a.owner && a.nextFollowUp));
  const techClaim = (facts.readinessClaims ?? []).some((x) => x.role === 'TECH_LEAD');
  const docs = Boolean(d.docsLocation)
    || evidence.some((e) => e.authorRole === 'KT_OWNER' && e.text.includes('/Team/'));
  const covered = activities.length > 0
    && activities.every((a) => a.level !== 'NOT_COVERED' && a.level !== 'UNKNOWN');
  const row = (item: string, state: CheckState) => ({ item, state });
  return [
    row('Start date and movement type', 'CONFIRMED'),
    row('Project and exact role', c.project && d.role ? 'CONFIRMED' : c.project ? 'PARTIAL' : 'MISSING'),
    row('Line Manager / Technical Lead / KT Owner',
      d.lineManager && d.techLead && d.ktOwner ? 'CONFIRMED' : c.manager ? 'PARTIAL' : 'MISSING'),
    row('Required applications and permissions',
      tracked || requested ? 'CONFIRMED' : access.length ? 'PARTIAL' : 'UNKNOWN'),
    row('Access requests tracked', tracked ? 'CONFIRMED' : requested ? 'PARTIAL' : 'UNKNOWN'),
    row('KT topics and learning activities',
      d.reviewDate && activities.length ? 'CONFIRMED' : activities.length ? 'PARTIAL' : 'UNKNOWN'),
    row('Execution evidence', facts.validation && covered ? 'CONFIRMED' : activities.length ? 'PARTIAL' : 'UNKNOWN'),
    row('Expected readiness date', d.reviewDate ? 'CONFIRMED' : 'MISSING'),
    row('Technical-owner validation', facts.validation ? 'CONFIRMED' : techClaim ? 'PARTIAL' : 'UNKNOWN'),
    row('KT documents or folder location', docs ? 'CONFIRMED' : 'UNKNOWN'),
    row('Blockers owned and followed up', flags.length ? 'MISSING' : facts.validation ? 'CONFIRMED' : 'UNKNOWN'),
  ];
}

function actionsFor(flag: Flag, facts: Facts): NextAction[] {
  const a = (title: string, ownerRole: string): NextAction => ({ title, ownerRole, flagCode: flag.code });
  switch (flag.code) {
    case 'ACCESS_NOT_USABLE':
      return (facts.access ?? [])
        .filter((x) => x.state === 'NOT_REQUESTED' || x.state === 'REQUESTED' || x.state === 'APPROVED')
        .map((x) => x.state === 'NOT_REQUESTED'
          ? a(`Request access to ${x.system}`, 'Line Manager')
          : x.state === 'APPROVED'
          ? a(`Confirm the employee can use ${x.system}`, 'Employee')
          : x.owner
            ? a(`Get a delivery date for ${x.system}`, x.owner)
            : a(`Identify the application owner and get approval for ${x.system}`, 'Line Manager'));
    case 'READINESS_CONFLICT':
      return [
        a('Cover and assess the two complex scenarios, then set a review date', 'Technical Lead'),
        a('Report to Management that the case stays open', 'Additional Manager'),
      ];
    case 'OPEN_BLOCKER': return [a('Remove the blocker and record how it was resolved', 'Line Manager')];
    case 'BLOCKED_NO_DETAIL': return [a('Record what is blocking, who owns it and the follow-up date', 'Line Manager')];
    case 'UNANSWERED_REQUEST': return [a('Escalate the unanswered request', 'Line Manager')];
    case 'STALE_STATUS': return [a('Ask for a current update, including access', 'Additional Manager')];
    case 'MISSING_PROJECT': return [a('Confirm the project and exact role', 'Additional Manager')];
    case 'MISSING_MANAGER': return [a('Assign and record the manager', 'Additional Manager')];
    case 'STATUS_DATE_MISMATCH': return [a('Check that onboarding has actually started', 'HR')];
    case 'NO_REVIEW_DATE': return [a('Schedule the final readiness review', 'Technical Lead')];
    case 'NOT_VALIDATED': return [a('Observe the activities and validate readiness', 'Technical Lead')];
    default: return [];
  }
}

export function assess(c: OnboardingCase, facts: Facts, evidence: Evidence[], asOf = AS_OF): Assessment {
  const flags = findFlags(c, facts, asOf);
  const checklist = buildChecklist(c, facts, evidence, flags);
  const activities = facts.activities ?? [];
  const red = flags.some((f) => f.severity === 'RED');

  let decision: Decision = 'NEEDS_INFORMATION';
  if (red || activities.some((x) => x.level !== 'INDEPENDENT')) decision = 'CANNOT_CLOSE';
  else if (!flags.length && activities.length && activities.every((x) => x.validatedByTechOwner)
    && checklist.every((x) => x.state === 'CONFIRMED')) decision = 'CAN_CLOSE';

  const colour: Colour = red ? 'RED' : flags.length ? 'AMBER' : decision === 'CAN_CLOSE' ? 'GREEN' : 'GREY';

  const missing = checklist.filter((x) => x.state !== 'CONFIRMED').map((x) => x.item);
  const closed = decision === 'CAN_CLOSE'
    && (facts.reports ?? []).some((r) => r.role === 'ADDITIONAL_MANAGER' && r.status === 'COMPLETED');
  const actions: NextAction[] = flags.length
    ? flags.flatMap((f) => actionsFor(f, facts))
    : closed ? [] : [{
      title: decision === 'CAN_CLOSE' ? 'Report completion to Management' : `Complete: ${missing.join('; ')}`,
      ownerRole: 'Additional Manager',
      flagCode: null,
    }];

  return { flags, decision, colour, checklist, actions };
}
