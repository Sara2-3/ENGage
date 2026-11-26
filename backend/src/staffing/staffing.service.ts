// People asked from HR and assigned to projects (team flow).
import { BadRequestException, Injectable } from '@nestjs/common';

import { CasesService } from '../cases/cases.service';
import { addEvent, addStaffing, fillStaffing, markAssigned, readStaffing } from '../database/repository';
import { SECRET, text } from '../Helper/text';
import { AS_OF } from '../rules/engine';
import { DIRECTIONS } from '../rules/types';
import type { Assignment, FillDto, HireDto } from './DTO/staffing.dto';

const LEVELS = ['JUNIOR', 'MID', 'SENIOR'];

@Injectable()
export class StaffingService {
  constructor(private readonly casesService: CasesService) {}

  public async findAll() {
    return readStaffing();
  }

  // `need` is the role being looked for; the rest are the specifics HR matches against.
  public async create(body: Record<string, unknown>) {
    const from = body?.actorRole;
    if (from !== 'ADDITIONAL_MANAGER') throw new BadRequestException('Only the Additional Manager can request people.');
    const project = text(body.project);
    const need = text(body.need);
    const skills = text(body.skills);
    const level = text(body.level);
    const startDate = text(body.startDate);
    const notes = text(body.notes);
    const type = text(body.type);
    if (type !== 'NEW_HIRE' && type !== 'REALLOCATION') throw new BadRequestException('Choose new hire or reallocation.');
    const direction = type === 'NEW_HIRE' ? text(body.direction) : '';
    if (type === 'NEW_HIRE' && !DIRECTIONS.includes(direction)) throw new BadRequestException('Choose a professional direction for the new hire.');
    if (!project || !need || !skills) throw new BadRequestException('Project, role and technical skills are required.');
    if (!LEVELS.includes(level)) throw new BadRequestException('Choose a level: Junior, Mid or Senior.');
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new BadRequestException('Start date is not valid.');
    if (SECRET.test([need, skills, notes].join(' '))) throw new BadRequestException('Do not store passwords or credentials.');
    await addStaffing(project, need, { from, type, direction, skills, level, startDate, notes }, AS_OF);
    return this.findAll();
  }

  public async assign(body: Record<string, unknown>) {
    if (body?.actorRole !== 'ADDITIONAL_MANAGER') throw new BadRequestException('Only the Additional Manager can assign a project.');
    const to: Assignment = {
      project: text(body.project), role: text(body.role), lineManager: text(body.lineManager),
      techLead: text(body.techLead), ktOwner: text(body.ktOwner),
    };
    if (Object.values(to).some((v) => !v)) throw new BadRequestException('Fill in the project, the role and the three people.');
    const error = await this.assignPerson(text(body.caseId), to, Number(body.requestId) || undefined);
    if (error) throw new BadRequestException(error);
    return this.findAll();
  }

  public async hire(id: number, body: HireDto) {
    if (body?.actorRole !== 'HR') throw new BadRequestException('Only HR can register a new hire.');
    const employee = text(body.employee);
    const startDate = text(body.startDate);
    if (!employee || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
      throw new BadRequestException('Employee name and start date are required.');
    }
    const error = await this.hireForRequest(id, employee, startDate);
    if (error) throw new BadRequestException(error);
    return this.findAll();
  }

  public async fill(id: number, body: FillDto) {
    if (body?.actorRole !== 'HR') throw new BadRequestException('Only HR can propose an employee.');
    const error = await this.fillRequest(id, text(body.caseId));
    if (error) throw new BadRequestException(error);
    return this.findAll();
  }

  private async fillRequest(requestId: number, caseId: string): Promise<string | null> {
    const request = (await readStaffing()).find((x) => x.id === requestId);
    if (!request || request.status !== 'OPEN') return 'This request is not open.';
    if (request.specs.type === 'NEW_HIRE') return 'This request is for a new hire. Register the new person instead.';
    const detail = await this.casesService.detail(caseId);
    if (!detail) return 'Unknown employee.';
    const { movement, project } = detail.case;
    if (movement !== 'REALLOCATION' && project) return 'Only reallocations or people without a project can be proposed.';
    if (project === request.project) return 'This person is already on that project.';
    await fillStaffing(requestId, caseId);
    return null;
  }

  // A new-hire request is filled by registering the person. The project is assigned afterwards.
  private async hireForRequest(requestId: number, employee: string, startDate: string): Promise<string | null> {
    const request = (await readStaffing()).find((x) => x.id === requestId);
    if (!request || request.status !== 'OPEN') return 'This request is not open.';
    if (request.specs.type !== 'NEW_HIRE') return 'This request is for someone already in the company.';
    const created = await this.casesService.open({
      employee, movement: 'NEW_HIRE', startDate, project: null, direction: request.specs.direction ?? null,
    });
    await fillStaffing(requestId, created.id);
    return null;
  }

  // The Additional Manager puts a person on a project and names their team; onboarding starts from here.
  private async assignPerson(caseId: string, to: Assignment, requestId?: number): Promise<string | null> {
    const detail = await this.casesService.detail(caseId);
    if (!detail) return 'Unknown employee.';
    const request = requestId ? (await readStaffing()).find((x) => x.id === requestId) : undefined;
    if (requestId && (request?.caseId !== caseId || request.specs.assigned)) return 'This request is not waiting for an assignment.';
    const error = await this.casesService.record(caseId, { type: 'ASSIGN', actorRole: 'ADDITIONAL_MANAGER', payload: { ...to } });
    if (error) return error;
    await addEvent(caseId, { type: 'CONFIRM_START', actorRole: 'HR', payload: {} }, AS_OF);
    const { movement, direction } = detail.case;
    const moved = Boolean(detail.case.project) && detail.case.project !== to.project;
    const description = movement === 'NEW_HIRE' && !moved
      ? `New hire${direction ? ` in the ${direction} direction` : ''}, joining project ${to.project} as ${to.role}.`
      : `You are moving to project ${to.project} as ${to.role}.`;
    await addEvent(caseId, { type: 'PROFILE', actorRole: 'HR', payload: { description } }, AS_OF);
    if (requestId) await markAssigned(requestId);
    return null;
  }
}
