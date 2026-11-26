// The records the repository stores.
import type { Evidence, Facts, OnboardingCase } from '../../rules/types';
import type { CaseEvent } from '../../rules/workflow';

export interface Review {
  caseId: string;
  decision: 'approved' | 'rejected';
  message: string;
  at: string;
}

export interface StaffingSpecs {
  type: 'NEW_HIRE' | 'REALLOCATION';
  direction?: string;
  assigned?: boolean;
  from?: 'ADDITIONAL_MANAGER';
  skills: string;
  level: string;
  startDate: string;
  notes: string;
}

export interface StaffingRequest {
  id: number;
  project: string;
  need: string;
  specs: StaffingSpecs;
  status: 'OPEN' | 'FILLED';
  caseId: string | null;
  date: string;
}

export interface Data {
  cases: OnboardingCase[];
  evidence: Evidence[];
  facts: Record<string, Facts>;
  events: CaseEvent[];
}
