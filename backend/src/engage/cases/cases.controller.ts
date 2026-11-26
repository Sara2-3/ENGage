import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { templateAdvice } from '../ai/advisor';
import { addReview } from '../db/repository';
import { getCase, listCases, openCase, overview, record } from './store';

async function find(id: string) {
  const detail = await getCase(id);
  if (!detail) throw new NotFoundException(`Case ${id} not found`);
  return detail;
}

@Controller('cases')
export class CasesController {
  @Get()
  list() {
    return listCases();
  }

  @Post()
  async create(@Body() body: { actorRole?: string; employee?: string; movement?: string; startDate?: string; project?: string }) {
    const { actorRole, employee, movement, startDate, project } = body ?? {};
    if (actorRole !== 'HR') {
      throw new BadRequestException('Only HR can open a case.');
    }
    if (!employee?.trim() || (movement !== 'NEW_HIRE' && movement !== 'REALLOCATION')
      || !/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '') || Number.isNaN(Date.parse(startDate!))) {
      throw new BadRequestException('Employee, movement type and start date are required.');
    }
    return openCase({ employee: employee.trim(), movement, startDate: startDate!, project: project?.trim() || null });
  }

  @Post(':id/events')
  async event(@Param('id') id: string, @Body() body: { type?: string; actorRole?: string; payload?: Record<string, unknown> }) {
    await find(id);
    const error = await record(id, { type: body?.type as never, actorRole: body?.actorRole ?? '', payload: body?.payload ?? {} });
    if (error) throw new BadRequestException(error);
    return find(id);
  }

  @Get('overview')
  overview() {
    return overview();
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return find(id);
  }

  @Post(':id/advice')
  async advice(@Param('id') id: string) {
    return templateAdvice(await find(id));
  }

  // Human review. Sending is simulated: the decision is only recorded.
  @Post(':id/reviews')
  async review(@Param('id') id: string, @Body() body: { decision?: string; message?: string }) {
    await find(id);
    const { decision, message } = body ?? {};
    if ((decision !== 'approved' && decision !== 'rejected') || typeof message !== 'string' || !message.trim()) {
      throw new BadRequestException('decision (approved or rejected) and message are required');
    }
    const entry = { caseId: id, decision: decision as 'approved' | 'rejected', message, at: new Date().toISOString() };
    await addReview(entry);
    return entry;
  }
}
