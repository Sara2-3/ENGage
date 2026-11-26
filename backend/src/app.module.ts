import { Module } from "@nestjs/common";

import { EVIDENCE_ANALYSIS_MODEL } from "./analysis.model";
import { AnalysisService } from "./analysis.service";
import { FollowUpService } from "./follow-up.service";
import { HealthController } from "./health.controller";
import { DatabaseService } from "./database.service";
import { MockEvidenceAnalysisModel } from "./mock-analysis.model";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  controllers: [HealthController, OnboardingController],
  providers: [
    AnalysisService,
    DatabaseService,
    FollowUpService,
    OnboardingService,
    MockEvidenceAnalysisModel,
    {
      provide: EVIDENCE_ANALYSIS_MODEL,
      useExisting: MockEvidenceAnalysisModel,
    },
  ],
})
export class AppModule {}
