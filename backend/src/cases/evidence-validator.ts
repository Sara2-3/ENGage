import { z } from 'zod';

import type { Facts } from '../rules/types';
import { CREDENTIAL_PATTERN, validateEvent } from '../rules/workflow';

const base = {
  quote: z.string().trim().min(1).max(5_000),
  confidence: z.number().min(0).max(1),
};

export const EvidenceProposalSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ACCESS'),
    payload: z.object({
      system: z.string().trim().min(1).max(500),
      state: z.enum(['NOT_REQUESTED', 'REQUESTED', 'APPROVED', 'USABLE']),
      owner: z.string().trim().min(1).max(500).optional(),
      nextFollowUp: z.string().trim().min(1).max(500).optional(),
    }).strict(),
    ...base,
  }).strict(),
  z.object({
    type: z.literal('ACTIVITY'),
    payload: z.object({
      name: z.string().trim().min(1).max(500),
      level: z.enum(['NOT_COVERED', 'SHADOWING', 'SUPPORTED', 'INDEPENDENT']),
    }).strict(),
    ...base,
  }).strict(),
  z.object({
    type: z.literal('BLOCKER'),
    payload: z.object({
      description: z.string().trim().min(1).max(500),
      owner: z.string().trim().min(1).max(500).optional(),
      nextFollowUp: z.string().trim().min(1).max(500).optional(),
    }).strict(),
    ...base,
  }).strict(),
  z.object({
    type: z.literal('REQUEST_ANSWERED'),
    payload: z.object({ note: z.string().trim().min(1).max(500) }).strict(),
    ...base,
  }).strict(),
]);

export type EvidenceProposal = z.infer<typeof EvidenceProposalSchema>;

export type ValidProposal = EvidenceProposal & { valid: true };

export interface RejectedProposal {
  type: string;
  payload: Record<string, unknown>;
  quote: string;
  reason: string;
}

const normaliseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const rejectedShape = (value: unknown): Omit<RejectedProposal, 'reason'> => {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    type: typeof item.type === 'string' ? item.type : 'UNKNOWN',
    payload: item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload as Record<string, unknown> : {},
    quote: typeof item.quote === 'string' ? item.quote : '',
  };
};

export function validateEvidenceProposals(
  values: unknown[],
  sourceText: string,
  actorRole: string,
  facts: Facts,
): { proposals: ValidProposal[]; rejected: RejectedProposal[] } {
  const proposals: ValidProposal[] = [];
  const rejected: RejectedProposal[] = [];
  const normalisedSource = normaliseWhitespace(sourceText);

  for (const value of values) {
    const parsed = EvidenceProposalSchema.safeParse(value);
    if (!parsed.success) {
      rejected.push({ ...rejectedShape(value), reason: 'Invalid proposal schema.' });
      continue;
    }

    const proposal = parsed.data;
    if (!normalisedSource.includes(normaliseWhitespace(proposal.quote))) {
      rejected.push({ ...rejectedShape(proposal), reason: 'The quote is not present in the pasted text.' });
      continue;
    }
    if (CREDENTIAL_PATTERN.test(JSON.stringify(proposal.payload))) {
      rejected.push({ ...rejectedShape(proposal), reason: 'Do not store passwords or credentials.' });
      continue;
    }

    const eventError = validateEvent({ type: proposal.type, actorRole, payload: proposal.payload }, facts);
    if (eventError) {
      rejected.push({ ...rejectedShape(proposal), reason: eventError });
      continue;
    }
    proposals.push({ ...proposal, valid: true });
  }

  return { proposals, rejected };
}
