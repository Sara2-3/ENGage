// Request bodies of the staffing endpoints. StaffingService checks the values.
export class HireDto {
  actorRole?: string;
  employee?: string;
  startDate?: string;
}

export class FillDto {
  actorRole?: string;
  caseId?: string;
}

export interface Assignment {
  project: string;
  role: string;
  lineManager: string;
  techLead: string;
  ktOwner: string;
}
