// Request bodies of the cases endpoints. CasesService checks the values.
export class CreateCaseDto {
  actorRole?: string;
  employee?: string;
  movement?: string;
  startDate?: string;
  project?: string;
  direction?: string;
  description?: string;
}

export class CaseEventDto {
  type?: string;
  actorRole?: string;
  payload?: Record<string, unknown>;
}

export class ReviewDto {
  decision?: string;
  message?: string;
}
