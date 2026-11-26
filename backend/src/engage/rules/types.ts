export type Level = 'NOT_COVERED' | 'SHADOWING' | 'SUPPORTED' | 'INDEPENDENT' | 'UNKNOWN';
export type AccessState = 'NOT_REQUESTED' | 'REQUESTED' | 'APPROVED' | 'USABLE' | 'UNKNOWN';
export type Severity = 'RED' | 'AMBER';
export type Colour = 'RED' | 'AMBER' | 'GREY' | 'GREEN';
export type Decision = 'CANNOT_CLOSE' | 'NEEDS_INFORMATION' | 'CAN_CLOSE';
export type CheckState = 'CONFIRMED' | 'PARTIAL' | 'MISSING' | 'UNKNOWN';

export interface OnboardingCase {
  id: string;
  employee: string;
  startDate: string;
  movement: 'NEW_HIRE' | 'REALLOCATION';
  project: string | null;
  manager: string | null;
  trackerStatus: string;
  lastUpdate: string;
  direction?: string | null; // professional field of a new hire
}

export const DIRECTIONS = ['Java', '.NET', 'Angular', 'SAP', 'Microsoft Dynamics'];

export interface Evidence {
  id: string;
  caseId: string;
  date: string;
  authorRole: string;
  title: string;
  text: string;
}

export interface AccessItem {
  system: string;
  state: AccessState;
  note: string;
  requestedOn: string | null;
  owner: string | null;
  nextFollowUp: string | null;
  evidenceIds: string[];
}

export interface Activity {
  name: string;
  level: Level;
  validatedByTechOwner: boolean;
  evidenceIds: string[];
}

export interface Facts {
  access?: AccessItem[];
  activities?: Activity[];
  readinessClaims?: { evidenceId: string; role: string; claim: string }[];
  requests?: { what: string; to: string; sentOn: string; answeredOn: string | null; evidenceId: string }[];
  reviewNotScheduled?: { evidenceId: string };
  // Filled by workflow records made in the app.
  details?: { role?: string; lineManager?: string; techLead?: string; ktOwner?: string; reviewDate?: string; docsLocation?: string; requirement?: string; description?: string };
  blockers?: { description: string; owner: string | null; nextFollowUp: string | null; resolved: boolean; evidenceId: string }[];
  startConfirmed?: boolean;
  reports?: { role: string; status: string; note: string; date: string }[];
  tasks?: { id: string; title: string; project: string; due: string | null; done: boolean }[];
  pastProjects?: string[];
  // Reviews written for the employee by the levels above.
  feedback?: { role: string; rating: string; text: string; date: string }[];
  validation?: { outcome: string; date: string; evidenceId: string };
}

export interface Flag {
  code: string;
  severity: Severity;
  label: string;
  message: string;
  evidenceIds: string[];
}

export interface NextAction {
  title: string;
  ownerRole: string;
  flagCode: string | null;
}

export interface ChecklistItem {
  item: string;
  state: CheckState;
}

export interface Assessment {
  flags: Flag[];
  decision: Decision;
  colour: Colour;
  checklist: ChecklistItem[];
  actions: NextAction[];
}
