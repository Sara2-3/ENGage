import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, ForbiddenException, Query, Req, StreamableFile } from '@nestjs/common';
import { templateAdvice } from '../ai/advisor';
import { addReview, readCv, saveCv } from '../db/repository';
import { DIRECTIONS } from '../rules/types';
import { validateEvent } from '../rules/workflow';
import { getCase, listCases, openCase, overview, record } from './store';

async function find(id: string) {
  const detail = await getCase(id);
  if (!detail) throw new NotFoundException(`Case ${id} not found`);
  return detail;
}

// The roles that may open a CV. There is no login in this demo, so the role is what the page says it is.
const CV_READERS = ['MANAGEMENT', 'HR', 'PMO', 'ADDITIONAL_MANAGER', 'TECH_LEAD', 'LINE_MANAGER', 'EMPLOYEE'];

@Controller('cases')
export class CasesController {
  @Get()
  list() {
    return listCases();
  }

  @Post()
  async create(@Body() body: { actorRole?: string; employee?: string; movement?: string; startDate?: string; project?: string; direction?: string; description?: string }) {
    const { actorRole, employee, movement, startDate, project, direction } = body ?? {};
    if (actorRole !== 'HR') {
      throw new BadRequestException('Only HR can open a case.');
    }
    if (!employee?.trim() || (movement !== 'NEW_HIRE' && movement !== 'REALLOCATION')
      || !/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '') || Number.isNaN(Date.parse(startDate!))) {
      throw new BadRequestException('Employee, movement type and start date are required.');
    }
    if (movement === 'NEW_HIRE' && !DIRECTIONS.includes(direction ?? '')) {
      throw new BadRequestException('Choose a professional direction for the new hire.');
    }
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const invalid = description && validateEvent({ type: 'PROFILE', actorRole: 'HR', payload: { description } }, {});
    if (invalid) throw new BadRequestException(invalid);
    return openCase({
      employee: employee.trim(), movement, startDate: startDate!, project: project?.trim() || null,
      direction: movement === 'NEW_HIRE' ? direction : null,
    }, description);
  }

  @Post(':id/events')
  async event(@Param('id') id: string, @Body() body: { type?: string; actorRole?: string; payload?: Record<string, unknown> }) {
    await find(id);
    const error = await record(id, { type: body?.type as never, actorRole: body?.actorRole ?? '', payload: body?.payload ?? {} });
    if (error) throw new BadRequestException(error);
    return find(id);
  }

  @Get(':id/cv')
  async cv(@Param('id') id: string, @Query('role') role?: string) {
    if (!CV_READERS.includes(role ?? '')) throw new ForbiddenException('This role cannot open CVs.');
    const data = await readCv(id);
    if (!data) throw new NotFoundException('No CV for this employee.');
    return new StreamableFile(data, { type: 'application/pdf', disposition: `inline; filename="CV-${id.replace(/[^A-Z0-9-]/g, '')}.pdf"` });
  }

  @Post(':id/cv')
  async uploadCv(@Param('id') id: string, @Query('role') role: string, @Req() req: { body: unknown }) {
    if (role !== 'HR') throw new ForbiddenException('Only HR can upload a CV.');
    await find(id);
    const data = req.body;
    if (!Buffer.isBuffer(data) || data.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new BadRequestException('Upload a PDF file.');
    }
    await saveCv(id, data);
    return { saved: true };
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
