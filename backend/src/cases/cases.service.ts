// Combines stored data, workflow records and the rules engine.
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';

import type { Data, Review } from '../database/Entity/storage.entities';
import { addCase, addEvent, addReview, readCv, readCvIds, readData, readReviews, saveCv } from '../database/repository';
import { assess, AS_OF } from '../rules/engine';
import { DIRECTIONS, type OnboardingCase } from '../rules/types';
import { applyEvents, stages, validateEvent, type NewEvent } from '../rules/workflow';
import { ActionAdvisor } from './advisor';
import { EvidenceExtractor } from './evidence-extractor';
import type { BriefDto, CaseEventDto, CreateCaseDto, ExtractDto, ReviewDto } from './DTO/case.dto';

const BRIEF_READERS = ['PMO', 'ADDITIONAL_MANAGER', 'TECH_LEAD'];
const EXTRACTOR_ROLES = ['ADDITIONAL_MANAGER', 'TECH_LEAD'];

// The roles that may open a CV. There is no login check on the API, so the role is what the page says it is.
const CV_READERS = ['MANAGEMENT', 'HR', 'PMO', 'ADDITIONAL_MANAGER', 'TECH_LEAD', 'LINE_MANAGER', 'EMPLOYEE'];

function evaluate(base: OnboardingCase, data: Data) {
  const applied = applyEvents(base, data.facts[base.id] ?? {}, data.events.filter((e) => e.caseId === base.id));
  const evidence = [...data.evidence.filter((e) => e.caseId === base.id), ...applied.evidence];
  return { case: applied.case, facts: applied.facts, evidence, assessment: assess(applied.case, applied.facts, evidence) };
}

@Injectable()
export class CasesService {
  constructor(
    private readonly actionAdvisor: ActionAdvisor,
    private readonly evidenceExtractor: EvidenceExtractor,
  ) {}

  public async findOne(id: string) {
    const detail = await this.detail(id);
    if (!detail) throw new NotFoundException(`Case ${id} not found`);
    return detail;
  }

  // One case with everything about it, or null when it does not exist.
  public async detail(id: string) {
    const data = await readData();
    const base = data.cases.find((x) => x.id === id);
    if (!base) return null;
    const { case: c, facts, evidence, assessment } = evaluate(base, data);
    return {
      asOf: AS_OF,
      case: c,
      hasCv: (await readCvIds()).has(id),
      details: facts.details ?? {},
      evidence,
      access: facts.access ?? [],
      activities: facts.activities ?? [],
      blockers: facts.blockers ?? [],
      reports: facts.reports ?? [],
      feedback: facts.feedback ?? [],
      tasks: facts.tasks ?? [],
      projects: [...new Set([...(facts.pastProjects ?? []), ...(c.project ? [c.project] : [])])],
      stages: stages(c, facts),
      assessment,
      reviews: await readReviews(id),
    };
  }

  // Every case with its details, for the role dashboards.
  public async overview() {
    const data = await readData();
    const cvs = await readCvIds();
    return data.cases.map((base) => {
      const { case: c, facts, evidence, assessment } = evaluate(base, data);
      return {
        case: c,
        hasCv: cvs.has(c.id),
        details: facts.details ?? {},
        evidence,
        access: facts.access ?? [],
        activities: facts.activities ?? [],
        blockers: facts.blockers ?? [],
        reports: facts.reports ?? [],
        feedback: facts.feedback ?? [],
        tasks: facts.tasks ?? [],
        projects: [...new Set([...(facts.pastProjects ?? []), ...(c.project ? [c.project] : [])])],
        stages: stages(c, facts),
        assessment,
      };
    });
  }

  public async findAll() {
    const data = await readData();
    return data.cases
      .map((base) => {
        const { case: c, assessment } = evaluate(base, data);
        return {
          id: c.id,
          employee: c.employee,
          movement: c.movement,
          project: c.project,
          startDate: c.startDate,
          manager: c.manager,
          status: c.trackerStatus,
          lastUpdate: c.lastUpdate,
          issues: assessment.flags.map((f) => f.code),
          colour: assessment.colour,
          decision: assessment.decision,
          label: assessment.flags[0]?.label
            ?? (assessment.decision === 'CAN_CLOSE' ? 'Ready to close' : 'Not enough evidence'),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  // Records one workflow step. Returns an error message, or null when saved.
  public async record(id: string, event: NewEvent): Promise<string | null> {
    const data = await readData();
    const base = data.cases.find((x) => x.id === id)!;
    const error = validateEvent(event, evaluate(base, data).facts);
    if (!error) await addEvent(id, event, AS_OF);
    return error;
  }

  public async addRecord(id: string, body: CaseEventDto) {
    await this.findOne(id);
    const error = await this.record(id, {
      type: body?.type as never, actorRole: body?.actorRole ?? '', payload: body?.payload ?? {},
    });
    if (error) throw new BadRequestException(error);
    return this.findOne(id);
  }

  // HR opens a case from the form.
  public async create(body: CreateCaseDto) {
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
    return this.open({
      employee: employee.trim(), movement, startDate: startDate!, project: project?.trim() || null,
      direction: movement === 'NEW_HIRE' ? direction : null,
    }, description);
  }

  // Opens a new case (workflow steps 1 to 3).
  public async open(
    input: Pick<OnboardingCase, 'employee' | 'movement' | 'startDate' | 'project' | 'direction'>,
    description?: string,
  ) {
    const data = await readData();
    const next = Math.max(...data.cases.map((c) => Number(c.id.slice(4)))) + 1;
    const created: OnboardingCase = {
      id: `ONB-${String(next).padStart(3, '0')}`,
      ...input,
      manager: null,
      trackerStatus: 'Pre-Onboarding',
      lastUpdate: AS_OF,
    };
    await addCase(created);
    // Every employee starts with a description; HR can change it later.
    const where = created.project ? `project ${created.project}` : 'a new project';
    const text = description?.trim() || (created.movement === 'NEW_HIRE'
      ? `New hire${created.direction ? ` in the ${created.direction} direction` : ''}, joining ${where}.`
      : `You are moving to ${where}.`);
    await addEvent(created.id, { type: 'PROFILE', actorRole: 'HR', payload: { description: text } }, AS_OF);
    return created;
  }

  public async cv(id: string, role?: string) {
    if (!CV_READERS.includes(role ?? '')) throw new ForbiddenException('This role cannot open CVs.');
    const data = await readCv(id);
    if (!data) throw new NotFoundException('No CV for this employee.');
    return new StreamableFile(data, { type: 'application/pdf', disposition: `inline; filename="CV-${id.replace(/[^A-Z0-9-]/g, '')}.pdf"` });
  }

  public async uploadCv(id: string, role: string, data: unknown) {
    if (role !== 'HR') throw new ForbiddenException('Only HR can upload a CV.');
    await this.findOne(id);
    if (!Buffer.isBuffer(data) || data.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new BadRequestException('Upload a PDF file.');
    }
    await saveCv(id, data);
    return { saved: true };
  }

  public async advice(id: string) {
    return this.actionAdvisor.advise(await this.findOne(id));
  }

  // Evidence, gaps and actions come from the rules; the model only words the explanation and the draft.
  public async brief(id: string, body: BriefDto) {
    if (!BRIEF_READERS.includes(body?.actorRole ?? '')) {
      throw new ForbiddenException('This role cannot build an evidence brief.');
    }
    const detail = await this.findOne(id);
    const advice = await this.actionAdvisor.advise(detail);
    return {
      evidence: detail.evidence.map((item) => ({
        id: item.id,
        authorRole: item.authorRole,
        quote: item.text,
        text: item.text,
      })),
      gaps: {
        flags: detail.assessment.flags,
        unknowns: detail.assessment.checklist.filter((item) => item.state !== 'CONFIRMED'),
      },
      actions: detail.assessment.actions,
      whatWouldChangeTheDecision: advice.whatWouldChangeTheDecision,
      conflictExplanation: advice.conflictExplanation,
      draft: advice.draft,
      citedEvidenceIds: advice.citedEvidenceIds,
      source: advice.source,
    };
  }

  // Proposes records from a pasted message. Nothing is written; a person accepts each proposal.
  public async extract(id: string, body: ExtractDto) {
    const actorRole = body?.actorRole ?? '';
    if (!EXTRACTOR_ROLES.includes(actorRole)) {
      throw new ForbiddenException('Only the Additional Manager or Technical Lead can extract evidence.');
    }
    await this.findOne(id);
    if (typeof body?.text !== 'string' || !body.text.trim() || body.text.length > 5_000) {
      throw new BadRequestException('Text must contain 1 to 5000 characters.');
    }
    const facts = await this.facts(id);
    if (!facts) throw new NotFoundException(`Case ${id} not found`);
    return this.evidenceExtractor.extract({
      actorRole,
      authorRole: typeof body.authorRole === 'string' ? body.authorRole : '',
      text: body.text,
      facts,
    });
  }

  // Case facts for proposal validation. Reading them records nothing.
  private async facts(id: string) {
    const data = await readData();
    const base = data.cases.find((x) => x.id === id);
    return base ? evaluate(base, data).facts : null;
  }

  // Human review. Sending is simulated: the decision is only recorded.
  public async review(id: string, body: ReviewDto) {
    await this.findOne(id);
    const { decision, message } = body ?? {};
    if ((decision !== 'approved' && decision !== 'rejected') || typeof message !== 'string' || !message.trim()) {
      throw new BadRequestException('decision (approved or rejected) and message are required');
    }
    const entry: Review = { caseId: id, decision, message, at: new Date().toISOString() };
    await addReview(entry);
    return entry;
  }
}
