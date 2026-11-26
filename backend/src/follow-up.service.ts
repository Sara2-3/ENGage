import { randomUUID } from "node:crypto";

import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "./database.service";
import { OnboardingService } from "./onboarding.service";

const TECHNICAL_REVIEW = "Technical Review";
const TECHNICAL_LEAD = "Technical Lead";
const OPEN = "Open";
const MAX_DESCRIPTION_LENGTH = 2000;

interface FollowUpRow {
  task_id: string;
  case_id: string;
  task_type: string;
  description: string;
  assignee_role: string;
  status: string;
  created_at: Date | string;
}

export interface FollowUpTask {
  taskId: string;
  caseId: string;
  taskType: string;
  description: string;
  assigneeRole: string;
  status: string;
  createdAt: string;
}

@Injectable()
export class FollowUpService {
  private readonly mockTasksByCase = new Map<string, FollowUpTask>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async listForCase(caseId: string): Promise<FollowUpTask[]> {
    try {
      await this.onboardingService.getCase(caseId);

      if (!this.databaseService.isConfigured()) {
        const task = this.mockTasksByCase.get(caseId);
        return task ? [structuredClone(task)] : [];
      }

      const result = await this.databaseService.query<FollowUpRow>(
        `SELECT task_id, case_id, task_type, description, assignee_role, status, created_at
         FROM follow_up_tasks
         WHERE case_id = $1
         ORDER BY created_at DESC, task_id DESC`,
        [caseId],
      );

      return result.rows.map((row) => this.mapTask(row));
    } catch (error) {
      this.rethrowSafeError(error);
    }
  }

  async createTechnicalReview(
    caseId: string,
    descriptionInput: unknown,
  ): Promise<FollowUpTask> {
    const description = this.validateDescription(descriptionInput);

    try {
      await this.onboardingService.getCase(caseId);

      if (!this.databaseService.isConfigured()) {
        const existingTask = this.mockTasksByCase.get(caseId);

        if (existingTask) {
          return structuredClone(existingTask);
        }

        const task: FollowUpTask = {
          taskId: randomUUID(),
          caseId,
          taskType: TECHNICAL_REVIEW,
          description,
          assigneeRole: TECHNICAL_LEAD,
          status: OPEN,
          createdAt: new Date().toISOString(),
        };
        this.mockTasksByCase.set(caseId, task);
        return structuredClone(task);
      }

      await this.databaseService.query(
        `INSERT INTO follow_up_tasks (
           task_id, case_id, task_type, description, assignee_role, status
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (case_id)
           WHERE task_type = 'Technical Review' AND status = 'Open'
         DO NOTHING`,
        [randomUUID(), caseId, TECHNICAL_REVIEW, description, TECHNICAL_LEAD, OPEN],
      );

      const existing = await this.databaseService.query<FollowUpRow>(
        `SELECT task_id, case_id, task_type, description, assignee_role, status, created_at
         FROM follow_up_tasks
         WHERE case_id = $1 AND task_type = $2 AND status = $3
         ORDER BY created_at ASC
         LIMIT 1`,
        [caseId, TECHNICAL_REVIEW, OPEN],
      );
      const task = existing.rows[0];

      if (!task) {
        throw new Error("The open technical review task could not be loaded");
      }

      return this.mapTask(task);
    } catch (error) {
      this.rethrowSafeError(error);
    }
  }

  private validateDescription(descriptionInput: unknown): string {
    if (typeof descriptionInput !== "string") {
      throw new BadRequestException({
        status: "invalid_description",
        message: "A task description is required.",
      });
    }

    const description = descriptionInput.trim();

    if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException({
        status: "invalid_description",
        message: `The task description must contain 1 to ${MAX_DESCRIPTION_LENGTH} characters.`,
      });
    }

    return description;
  }

  private mapTask(row: FollowUpRow): FollowUpTask {
    return {
      taskId: row.task_id,
      caseId: row.case_id,
      taskType: row.task_type,
      description: row.description,
      assigneeRole: row.assignee_role,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  private rethrowSafeError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new ServiceUnavailableException({
      status: "unavailable",
      message: "Follow-up tasks are temporarily unavailable.",
    });
  }
}
