import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { AnalysisService } from "./analysis.service";
import { EvidenceAnalysis } from "./analysis.schema";
import { FollowUpService, FollowUpTask } from "./follow-up.service";
import { OnboardingCase, OnboardingService } from "./onboarding.service";
import { llmConfigured } from "./openai-analysis.model";

interface CreateFollowUpBody {
  description?: unknown;
}

@Controller("onboarding/cases")
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly analysisService: AnalysisService,
    private readonly followUpService: FollowUpService,
  ) {}

  @Get(":caseId")
  getCase(@Param("caseId") caseId: string): Promise<OnboardingCase> {
    return this.onboardingService.getCase(caseId);
  }

  @Post(":caseId/analyze")
  async analyzeCase(@Param("caseId") caseId: string): Promise<EvidenceAnalysis & { source: string }> {
    const analysis = await this.analysisService.analyzeCase(caseId);
    return { ...analysis, source: llmConfigured() ? `AI model ${process.env.OPENAI_MODEL}` : "Simulated, no AI model" };
  }

  @Get(":caseId/follow-ups")
  getFollowUps(@Param("caseId") caseId: string): Promise<FollowUpTask[]> {
    return this.followUpService.listForCase(caseId);
  }

  @Post(":caseId/follow-ups")
  createFollowUp(
    @Param("caseId") caseId: string,
    @Body() body: CreateFollowUpBody,
  ): Promise<FollowUpTask> {
    return this.followUpService.createTechnicalReview(
      caseId,
      body?.description,
    );
  }
}
