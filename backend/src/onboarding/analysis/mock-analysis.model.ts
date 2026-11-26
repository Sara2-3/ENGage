import { Injectable } from "@nestjs/common";

import { EvidenceAnalysisModel } from "./analysis.model";
import { EvidenceAnalysis } from "./analysis.schema";
import { OnboardingCase } from "../Entity/onboarding-case";

@Injectable()
export class MockEvidenceAnalysisModel implements EvidenceAnalysisModel {
  async analyzeEvidence(onboardingCase: OnboardingCase): Promise<EvidenceAnalysis> {
    const technicalLead = onboardingCase.evidence.find(
      (source) => source.sourceId === "Email 3",
    );
    const lineManager = onboardingCase.evidence.find(
      (source) => source.sourceId === "Email 4",
    );

    if (!technicalLead || !lineManager) {
      return {
        findings: [],
        evidenceGap: { text: "Evidence is incomplete.", sourceIds: [] },
        suggestedNextAction: { text: "Review the source evidence.", sourceIds: [] },
      };
    }

    return {
      findings: [
        {
          claim:
            "The Technical Lead reports that Eva can handle standard requests with occasional support and has two complex scenarios left to cover.",
          sourceId: technicalLead.sourceId,
          quote:
            "can handle standard requests with occasional support. Two complex scenarios still need to be covered.",
        },
        {
          claim: "The Line Manager considers local onboarding closed.",
          sourceId: lineManager.sourceId,
          quote: "The Line Manager considers onboarding closed.",
        },
      ],
      evidenceGap: {
        text: "It is unclear whether local onboarding closure includes the two complex scenarios identified by the Technical Lead.",
        sourceIds: [technicalLead.sourceId, lineManager.sourceId],
      },
      suggestedNextAction: {
        text: "Ask the Technical Lead to review the two scenarios and record what Eva can perform independently.",
        sourceIds: [technicalLead.sourceId, lineManager.sourceId],
      },
    };
  }
}
