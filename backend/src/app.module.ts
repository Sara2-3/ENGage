import { Module } from "@nestjs/common";

import { EVIDENCE_ANALYSIS_MODEL } from "./analysis.model";
import { AnalysisService } from "./analysis.service";
import { FollowUpService } from "./follow-up.service";
import { HealthController } from "./health.controller";
import { DatabaseService } from "./database.service";
import { EngageModule } from "./engage/engage.module";
import { MockEvidenceAnalysisModel } from "./mock-analysis.model";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { llmConfigured, OpenAiEvidenceAnalysisModel } from "./openai-analysis.model";

@Module({
  imports: [EngageModule],
  controllers: [HealthController, OnboardingController],
  providers: [
    AnalysisService,
    DatabaseService,
    FollowUpService,
    OnboardingService,
    MockEvidenceAnalysisModel,
    OpenAiEvidenceAnalysisModel,
    {
      provide: EVIDENCE_ANALYSIS_MODEL,
      inject: [OpenAiEvidenceAnalysisModel, MockEvidenceAnalysisModel],
      useFactory: (llm: OpenAiEvidenceAnalysisModel, mock: MockEvidenceAnalysisModel) => (llmConfigured() ? llm : mock),
    },
  ],
})
export class AppModule {}
