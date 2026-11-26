import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';

import type { getCase } from '../cases/store';
import { ACTION_LLM_CLIENT, type ActionLlmClient } from './claude-client';

type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCase>>>;

const AdviceSchema = z.object({
  draft: z.object({
    to: z.string().trim().min(1).max(200),
    subject: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(5_000),
  }),
  whatWouldChangeTheDecision: z.string().trim().min(1).max(2_000),
  conflictExplanation: z.string().trim().min(1).max(2_000),
  citedEvidenceIds: z.array(z.string().trim().min(1)).max(100),
});

export type Advice = z.infer<typeof AdviceSchema> & {
  source: 'AI generated (Claude), pending human review' | 'Template, not AI generated';
};

export function templateAdvice({ case: c, assessment }: CaseDetail): Advice {
  const first = assessment.actions[0];
  const problems = assessment.flags.map((f) => `- ${f.message}`).join('\n')
    || '- There is not enough recorded evidence to confirm progress.';
  const steps = assessment.actions.map((a) => `- ${a.title} (${a.ownerRole})`).join('\n');
  const conflict = assessment.flags.find((flag) => flag.code === 'READINESS_CONFLICT');
  const missing = assessment.checklist.filter((item) => item.state !== 'CONFIRMED').map((item) => item.item);
  return {
    source: 'Template, not AI generated',
    citedEvidenceIds: [...new Set(assessment.flags.flatMap((f) => f.evidenceIds))],
    conflictExplanation: conflict?.message ?? 'No conflicting readiness statements were detected by the deterministic rules.',
    whatWouldChangeTheDecision: assessment.actions.length
      ? `Complete the recorded follow-up actions and provide evidence for: ${missing.join('; ') || 'the open issues'}. The rules will then reassess the case.`
      : 'No additional action is currently required by the deterministic assessment.',
    draft: {
      to: first?.ownerRole ?? 'Additional Manager',
      subject: `Onboarding follow-up: ${c.employee} (${c.id})`,
      body: `Hello,\n\nOpen points for ${c.employee}:\n${problems}\n\nProposed next steps:\n${steps || '- No further action recorded.'}\n\nCould you confirm the owner and a follow-up date?\n\nThank you`,
    },
  };
}

@Injectable()
export class ActionAdvisor {
  constructor(@Inject(ACTION_LLM_CLIENT) private readonly client: ActionLlmClient) {}

  async advise(detail: CaseDetail): Promise<Advice> {
    const fallback = templateAdvice(detail);
    if (!this.client.isConfigured()) return fallback;

    const allowedEvidenceIds = new Set(detail.evidence.map((item) => item.id));
    const input = {
      flags: detail.assessment.flags,
      checklist: detail.assessment.checklist,
      actions: detail.assessment.actions,
      evidence: detail.evidence.map((item) => ({ id: item.id, text: item.text })),
    };

    try {
      const parsed = AdviceSchema.safeParse(await this.client.generateJson(input));
      if (!parsed.success || parsed.data.citedEvidenceIds.some((id) => !allowedEvidenceIds.has(id))) {
        return fallback;
      }
      return { ...parsed.data, source: 'AI generated (Claude), pending human review' };
    } catch {
      return fallback;
    }
  }
}
