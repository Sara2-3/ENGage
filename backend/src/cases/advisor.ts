// Action Advisor (SPEC.md 5.3). No LLM provider is connected yet, so this returns
// the template fallback and says so. An LLM call replaces `templateAdvice` later.
import type { CasesService } from './cases.service';

type CaseDetail = NonNullable<Awaited<ReturnType<CasesService['detail']>>>;

export function templateAdvice({ case: c, assessment }: CaseDetail) {
  const first = assessment.actions[0];
  const problems = assessment.flags.map((f) => `- ${f.message}`).join('\n')
    || '- There is not enough recorded evidence to confirm progress.';
  const steps = assessment.actions.map((a) => `- ${a.title} (${a.ownerRole})`).join('\n');
  return {
    source: 'Template, not AI generated',
    citedEvidenceIds: [...new Set(assessment.flags.flatMap((f) => f.evidenceIds))],
    draft: {
      to: first.ownerRole,
      subject: `Onboarding follow-up: ${c.employee} (${c.id})`,
      body: `Hello,\n\nOpen points for ${c.employee}:\n${problems}\n\nProposed next steps:\n${steps}\n\nCould you confirm the owner and a follow-up date?\n\nThank you`,
    },
  };
}
