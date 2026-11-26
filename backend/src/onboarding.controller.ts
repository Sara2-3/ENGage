import { Controller, Get, Param, Post } from "@nestjs/common";

import { AnalysisService } from "./analysis.service";
import { EvidenceAnalysis } from "./analysis.schema";
import { OnboardingCase, OnboardingService } from "./onboarding.service";

@Controller("onboarding/cases")
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly analysisService: AnalysisService,
  ) {}

  @Get(":caseId")
  getCase(@Param("caseId") caseId: string): Promise<OnboardingCase> {
    return this.onboardingService.getCase(caseId);
  }

  @Post(":caseId/analyze")
  analyzeCase(@Param("caseId") caseId: string): Promise<EvidenceAnalysis> {
    return this.analysisService.analyzeCase(caseId);
  }
}
