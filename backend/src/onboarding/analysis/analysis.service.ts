import {
  BadGatewayException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";

import {
  EVIDENCE_ANALYSIS_MODEL,
  EvidenceAnalysisModel,
} from "./analysis.model";
import {
  EvidenceAnalysis,
  EvidenceAnalysisSchema,
} from "./analysis.schema";
import type { OnboardingCase } from "../Entity/onboarding-case";
import { OnboardingService } from "../onboarding.service";

@Injectable()
export class AnalysisService {
  constructor(
    private readonly onboardingService: OnboardingService,
    @Inject(EVIDENCE_ANALYSIS_MODEL)
    private readonly analysisModel: EvidenceAnalysisModel,
  ) {}

  async analyzeCase(caseId: string): Promise<EvidenceAnalysis> {
    const onboardingCase = await this.onboardingService.getCase(caseId);

    if (onboardingCase.evidence.length === 0) {
      throw new UnprocessableEntityException({
        status: "no_evidence",
        message: "This onboarding case has no evidence to analyze.",
      });
    }

    const modelOutput = await this.analysisModel.analyzeEvidence(onboardingCase);
    return this.validateAnalysis(modelOutput, onboardingCase);
  }

  private validateAnalysis(
    modelOutput: unknown,
    onboardingCase: OnboardingCase,
  ): EvidenceAnalysis {
    const parsed = EvidenceAnalysisSchema.safeParse(modelOutput);

    if (!parsed.success) {
      this.throwInvalidAnalysis();
    }

    const analysis = parsed.data;
    const evidenceById = new Map(
      onboardingCase.evidence.map((source) => [source.sourceId, source]),
    );

    if (analysis.findings.length === 0) {
      this.throwInvalidAnalysis();
    }

    for (const finding of analysis.findings) {
      const source = evidenceById.get(finding.sourceId);

      if (
        !finding.claim.trim() ||
        !finding.quote.trim() ||
        !source ||
        !source.originalText.includes(finding.quote)
      ) {
        this.throwInvalidAnalysis();
      }
    }

    this.validateTrace(
      analysis.evidenceGap.text,
      analysis.evidenceGap.sourceIds,
      evidenceById,
    );
    this.validateTrace(
      analysis.suggestedNextAction.text,
      analysis.suggestedNextAction.sourceIds,
      evidenceById,
    );

    return analysis;
  }

  private validateTrace(
    text: string,
    sourceIds: string[],
    evidenceById: Map<string, OnboardingCase["evidence"][number]>,
  ): void {
    if (
      !text.trim() ||
      sourceIds.length === 0 ||
      sourceIds.some((sourceId) => !evidenceById.has(sourceId))
    ) {
      this.throwInvalidAnalysis();
    }
  }

  private throwInvalidAnalysis(): never {
    throw new BadGatewayException({
      status: "invalid_analysis",
      message: "The analysis response could not be validated against the source evidence.",
    });
  }
}
