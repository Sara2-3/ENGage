export type Colour = 'RED' | 'AMBER' | 'GREY' | 'GREEN';


export interface Detail {
  asOf: string;
  hasCv?: boolean;
  tasks?: { id: string; title: string; project: string; due: string | null; done: boolean }[];
  projects?: string[];
  feedback?: { role: string; rating: string; text: string; date: string }[];
  case: { id: string; employee: string; movement: string; project: string | null; startDate: string; manager: string | null; trackerStatus: string; lastUpdate: string; direction?: string | null };
  details: Record<string, string | undefined>;
  evidence: { id: string; date: string; authorRole: string; title: string; text: string }[];
  access: { system: string; state: string; note: string; requestedOn: string | null; owner: string | null; nextFollowUp: string | null }[];
  activities: { name: string; level: string; validatedByTechOwner: boolean }[];
  blockers: { description: string; owner: string | null; nextFollowUp?: string | null; resolved: boolean }[];
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

// In order of seniority. HR supports the chain by finding people.
export const roles = [
  { key: 'PMO', title: 'PMO', task: 'Sees the whole system' },
  { key: 'MANAGEMENT', title: 'Management', task: 'Reviews reports' },
  { key: 'ADDITIONAL_MANAGER', title: 'Additional Manager', task: 'Asks HR, assigns projects' },
  { key: 'LINE_MANAGER', title: 'Line Manager', task: 'Progress and blockers' },
  { key: 'TECH_LEAD', title: 'Technical Lead', task: 'Gives technical tasks' },
  { key: 'EMPLOYEE', title: 'Employee', task: 'Does the tasks' },
  { key: 'HR', title: 'HR', task: 'Support: finds people' },
];

export interface StaffingRequest {
  id: number; project: string; need: string;
  specs?: { from?: string; assigned?: boolean; type?: string; direction?: string; skills?: string; level?: string; startDate?: string; notes?: string };
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

export const cvUrl = (caseId: string, role: string) => `${API_URL}/cases/${caseId}/cv?role=${role}`;

export async function uploadCv(caseId: string, file: File) {
  const res = await fetch(cvUrl(caseId, 'HR'), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Upload failed (${res.status})`);
}

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
