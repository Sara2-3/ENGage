import { OnboardingCase } from "./onboarding.service";

export const EVIDENCE_ANALYSIS_MODEL = Symbol("EVIDENCE_ANALYSIS_MODEL");

export interface EvidenceAnalysisModel {
  analyzeEvidence(onboardingCase: OnboardingCase): Promise<unknown>;
}
