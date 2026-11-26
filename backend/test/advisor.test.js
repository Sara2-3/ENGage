const assert = require('node:assert/strict');
const test = require('node:test');

const { ActionAdvisor } = require('../dist/cases/advisor');
const { CasesController } = require('../dist/cases/cases.controller');
const { CasesService } = require('../dist/cases/cases.service');

const detail = {
  case: { id: 'ONB-005', employee: 'Eva Stone' },
  evidence: [
    { id: 'EV-3', authorRole: 'TECH_LEAD', text: 'Two complex scenarios still need to be covered.' },
    { id: 'EV-4', authorRole: 'LINE_MANAGER', text: 'The Line Manager considers onboarding closed.' },
  ],
  assessment: {
    flags: [{
      code: 'READINESS_CONFLICT',
      severity: 'RED',
      label: 'Conflicting updates',
      message: 'The Line Manager considers onboarding closed; the Technical Lead says topics are still open.',
      evidenceIds: ['EV-3', 'EV-4'],
    }],
    checklist: [{ item: 'Execution evidence', state: 'PARTIAL' }],
    actions: [{
      title: 'Cover and assess the two complex scenarios, then set a review date',
      ownerRole: 'Technical Lead',
      flagCode: 'READINESS_CONFLICT',
    }],
  },
};

const validOutput = {
  draft: { to: 'Technical Lead', subject: 'Review needed', body: 'Please observe the two scenarios.' },
  whatWouldChangeTheDecision: 'Observed independent execution of both scenarios.',
  conflictExplanation: 'The local closure statement does not cover the two open technical scenarios.',
  citedEvidenceIds: ['EV-3', 'EV-4'],
};

test('uses the template fallback when no Claude key is configured', async () => {
  const advisor = new ActionAdvisor({
    isConfigured: () => false,
    generateJson: async () => assert.fail('The network client must not be called'),
  });

  const result = await advisor.advise(detail);
  assert.equal(result.source, 'Template, not AI generated');
  assert.equal(result.draft.to, 'Technical Lead');
});

test('rejects an AI result that cites an unknown evidence ID', async () => {
  const advisor = new ActionAdvisor({
    isConfigured: () => true,
    generateJson: async () => ({ ...validOutput, citedEvidenceIds: ['EV-99'] }),
  });

  const result = await advisor.advise(detail);
  assert.equal(result.source, 'Template, not AI generated');
  assert.deepEqual(result.citedEvidenceIds, ['EV-3', 'EV-4']);
});

test('uses the template fallback when the AI result fails the zod schema', async () => {
  const advisor = new ActionAdvisor({
    isConfigured: () => true,
    generateJson: async () => ({ draft: { to: '' } }),
  });

  const result = await advisor.advise(detail);
  assert.equal(result.source, 'Template, not AI generated');
});

test('accepts a valid injected AI result without using the network', async () => {
  const advisor = new ActionAdvisor({
    isConfigured: () => true,
    generateJson: async () => validOutput,
  });

  const result = await advisor.advise(detail);
  assert.equal(result.source, 'AI generated (Claude), pending human review');
  assert.equal(result.whatWouldChangeTheDecision, validOutput.whatWouldChangeTheDecision);
});

test('evidence brief rejects roles outside PMO, Additional Manager and Technical Lead', async () => {
  const controller = new CasesController(new CasesService({ advise: async () => validOutput }));

  await assert.rejects(
    controller.brief('ONB-005', { actorRole: 'HR' }),
    (error) => error.getStatus() === 403,
  );
});

test('PMO receives deterministic evidence, gaps and actions with template wording', async () => {
  const advisor = new ActionAdvisor({
    isConfigured: () => false,
    generateJson: async () => assert.fail('The network client must not be called'),
  });
  const controller = new CasesController(new CasesService(advisor));

  const brief = await controller.brief('ONB-005', { actorRole: 'PMO' });

  assert.equal(brief.source, 'Template, not AI generated');
  assert.ok(brief.evidence.some((item) => item.id === 'EV-3'));
  assert.ok(brief.gaps.flags.some((flag) => flag.code === 'READINESS_CONFLICT'));
  assert.ok(brief.actions.some((action) => action.ownerRole === 'Technical Lead'));
});
