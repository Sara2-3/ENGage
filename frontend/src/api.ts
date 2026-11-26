export type Colour = 'RED' | 'AMBER' | 'GREY' | 'GREEN';


export interface Detail {
  asOf: string;
  case: { id: string; employee: string; movement: string; project: string | null; startDate: string; manager: string | null; trackerStatus: string; lastUpdate: string; direction?: string | null };
  details: Record<string, string | undefined>;
  evidence: { id: string; date: string; authorRole: string; title: string; text: string }[];
  access: { system: string; state: string; note: string; requestedOn: string | null; owner: string | null; nextFollowUp: string | null }[];
  activities: { name: string; level: string; validatedByTechOwner: boolean }[];
  blockers: { description: string; owner: string | null; resolved: boolean }[];
  reports: { role: string; status: string; note: string; date: string }[];
  stages: { title: string; done: boolean }[];
  assessment: {
    colour: Colour;
    decision: string;
    flags: { code: string; message: string }[];
    actions: { title: string; ownerRole: string }[];
    checklist: { item: string; state: string }[];
  };
}

export const roles = [
  { key: 'MANAGEMENT', title: 'Management', task: 'Asks for people' },
  { key: 'HR', title: 'HR', task: 'Assigns and starts' },
  { key: 'EMPLOYEE', title: 'Employee', task: 'Learns and reports' },
  { key: 'ADDITIONAL_MANAGER', title: 'Additional Manager', task: 'Follows the process' },
  { key: 'TECH_LEAD', title: 'Technical Lead', task: 'Validates readiness' },
  { key: 'LINE_MANAGER', title: 'Line Manager', task: 'General progress' },
  { key: 'PMO', title: 'PMO', task: 'Whole system' },
];

export interface StaffingRequest {
  id: number; project: string; need: string;
  specs?: { type?: string; direction?: string; skills?: string; level?: string; startDate?: string; notes?: string };
  status: 'OPEN' | 'FILLED'; caseId: string | null; date: string;
}

// Professional directions of new hires, with a short description of each.
export const directionInfo: Record<string, string> = {
  Java: 'Back-end applications and services written in Java.',
  '.NET': 'Applications and services built with C# on the Microsoft .NET platform.',
  Angular: 'Web interfaces built with Angular and TypeScript.',
  SAP: 'Setting up and developing SAP business systems.',
  'Microsoft Dynamics': 'Setting up and extending Microsoft Dynamics for customer and business processes.',
};
export const directions = Object.keys(directionInfo);

export const words = (v: string) => v.replaceAll('_', ' ').toLowerCase().replace(/^./, (s) => s.toUpperCase());

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}
