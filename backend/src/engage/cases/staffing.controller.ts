import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { fillRequest, listStaffing, requestStaff } from './store';

const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '');

@Controller('staffing')
export class StaffingController {
  @Get()
  list() {
    return listStaffing();
  }

  @Post()
  async create(@Body() body: { actorRole?: string; project?: string; need?: string }) {
    if (body?.actorRole !== 'MANAGEMENT') throw new BadRequestException('Only Management can request people.');
    const project = text(body.project);
    const need = text(body.need);
    if (!project || !need) throw new BadRequestException('Project and need are required.');
    await requestStaff(project, need);
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
