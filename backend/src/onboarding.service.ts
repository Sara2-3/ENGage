import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "./database.service";

interface CaseRow {
  case_id: string;
  employee_name: string;
  project_name: string;
  reported_status: string;
}

interface EvidenceRow {
  source_id: string;
  author_role: string;
  source_date: string;
  original_text: string;
}

export interface OnboardingCase {
  caseId: string;
  employeeName: string;
  projectName: string;
  reportedStatus: string;
  evidence: Array<{
    sourceId: string;
    authorRole: string;
    date: string;
    originalText: string;
  }>;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCase(caseId: string): Promise<OnboardingCase> {
    try {
      const caseResult = await this.databaseService.query<CaseRow>(
        `SELECT case_id, employee_name, project_name, reported_status
         FROM onboarding_cases
         WHERE case_id = $1`,
        [caseId],
      );
      const caseRow = caseResult.rows[0];

      if (!caseRow) {
        throw new NotFoundException({
          status: "not_found",
          message: `Onboarding case ${caseId} was not found.`,
        });
      }

      const evidenceResult = await this.databaseService.query<EvidenceRow>(
        `SELECT source_id, author_role, source_date, original_text
         FROM onboarding_evidence
         WHERE case_id = $1
         ORDER BY source_id`,
        [caseId],
      );

      return {
        caseId: caseRow.case_id,
        employeeName: caseRow.employee_name,
        projectName: caseRow.project_name,
        reportedStatus: caseRow.reported_status,
        evidence: evidenceResult.rows.map((row) => ({
          sourceId: row.source_id,
          authorRole: row.author_role,
          date: row.source_date,
          originalText: row.original_text,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        status: "unavailable",
        message: "Onboarding data is temporarily unavailable.",
      });
    }
  }
}
