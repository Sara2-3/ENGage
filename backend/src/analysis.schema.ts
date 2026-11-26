import { z } from "zod/v4";

export const EvidenceAnalysisSchema = z.object({
  findings: z.array(
    z.object({
      claim: z.string(),
      sourceId: z.string(),
      quote: z.string(),
    }),
  ),
  evidenceGap: z.object({
    text: z.string(),
    sourceIds: z.array(z.string()),
  }),
  suggestedNextAction: z.object({
    text: z.string(),
    sourceIds: z.array(z.string()),
  }),
});

export type EvidenceAnalysis = z.infer<typeof EvidenceAnalysisSchema>;
