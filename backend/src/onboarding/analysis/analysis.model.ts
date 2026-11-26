import { OnboardingCase } from "../Entity/onboarding-case";

export const EVIDENCE_ANALYSIS_MODEL = Symbol("EVIDENCE_ANALYSIS_MODEL");

export interface EvidenceAnalysisModel {
  analyzeEvidence(onboardingCase: OnboardingCase): Promise<unknown>;
}
