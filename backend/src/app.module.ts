import { Module } from "@nestjs/common";

import { EVIDENCE_ANALYSIS_MODEL } from "./analysis.model";
import { AnalysisService } from "./analysis.service";
import { HealthController } from "./health.controller";
import { DatabaseService } from "./database.service";
import { OpenAiEvidenceAnalysisModel } from "./openai-analysis.model";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  controllers: [HealthController, OnboardingController],
  providers: [
    AnalysisService,
    DatabaseService,
    OnboardingService,
    OpenAiEvidenceAnalysisModel,
    {
      provide: EVIDENCE_ANALYSIS_MODEL,
      useExisting: OpenAiEvidenceAnalysisModel,
    },
  ],
})
export class AppModule {}
