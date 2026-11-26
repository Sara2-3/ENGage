import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DIRECTIONS } from '../rules/types';
import { assignPerson, fillRequest, hireForRequest, listStaffing, requestStaff } from './store';

const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '');
const LEVELS = ['JUNIOR', 'MID', 'SENIOR'];
const SECRET = /(password|passwd|fjalëkalim|api[_ -]?key|token)\s*[:=]/i;

@Controller('staffing')
export class StaffingController {
  @Get()
  list() {
    return listStaffing();
  }

  // `need` is the role Management is looking for; the rest are the specifics HR matches against.
  @Post()
  async create(@Body() body: Record<string, unknown>) {
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
    await requestStaff(project, need, { from, type, direction, skills, level, startDate, notes });
    return listStaffing();
  }

  @Post('assign')
  async assign(@Body() body: Record<string, unknown>) {
    if (body?.actorRole !== 'MANAGEMENT') throw new BadRequestException('Only Management can assign a project.');
    const to = {
      project: text(body.project), role: text(body.role), lineManager: text(body.lineManager),
      techLead: text(body.techLead), ktOwner: text(body.ktOwner),
    };
    if (Object.values(to).some((v) => !v)) throw new BadRequestException('Fill in the project, the role and the three people.');
    const error = await assignPerson(text(body.caseId), to, Number(body.requestId) || undefined);
    if (error) throw new BadRequestException(error);
    return listStaffing();
  }

  @Post(':id/hire')
  async hire(@Param('id') id: string, @Body() body: { actorRole?: string; employee?: string; startDate?: string }) {
    if (body?.actorRole !== 'HR') throw new BadRequestException('Only HR can register a new hire.');
    const employee = text(body.employee);
    const startDate = text(body.startDate);
    if (!employee || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
      throw new BadRequestException('Employee name and start date are required.');
    }
    const error = await hireForRequest(Number(id), employee, startDate);
    if (error) throw new BadRequestException(error);
    return listStaffing();
  }

  @Post(':id/fill')
  async fill(@Param('id') id: string, @Body() body: { actorRole?: string; caseId?: string }) {
    if (body?.actorRole !== 'HR') throw new BadRequestException('Only HR can propose an employee.');
    const error = await fillRequest(Number(id), text(body.caseId));
    if (error) throw new BadRequestException(error);
    return listStaffing();
  }
}
