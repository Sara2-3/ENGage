import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { AnalysisService } from "./analysis/analysis.service";
import { EvidenceAnalysis } from "./analysis/analysis.schema";
import { CreateFollowUpDto } from "./DTO/follow-up.dto";
import type { FollowUpTask } from "./Entity/follow-up-task";
import type { OnboardingCase } from "./Entity/onboarding-case";
import { FollowUpService } from "./follow-up.service";
import { OnboardingService } from "./onboarding.service";
import { llmConfigured } from "./analysis/openai-analysis.model";

@Controller("onboarding/cases")
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly analysisService: AnalysisService,
    private readonly followUpService: FollowUpService,
  ) {}

  @Get(":caseId")
  public async getCase(@Param("caseId") caseId: string): Promise<OnboardingCase> {
    return this.onboardingService.getCase(caseId);
  }

  @Post(":caseId/analyze")
  public async analyzeCase(@Param("caseId") caseId: string): Promise<EvidenceAnalysis & { source: string }> {
    const analysis = await this.analysisService.analyzeCase(caseId);
    return { ...analysis, source: llmConfigured() ? `AI model ${process.env.OPENAI_MODEL}` : "Simulated, no AI model" };
  }

  @Get(":caseId/follow-ups")
  public async getFollowUps(@Param("caseId") caseId: string): Promise<FollowUpTask[]> {
    return this.followUpService.listForCase(caseId);
  }

  @Post(":caseId/follow-ups")
  public async createFollowUp(
    @Param("caseId") caseId: string,
    @Body() body: CreateFollowUpDto,
  ): Promise<FollowUpTask> {
    return this.followUpService.createTechnicalReview(
      caseId,
      body?.description,
    );
  }
}
