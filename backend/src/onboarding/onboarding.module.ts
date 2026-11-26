import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { EVIDENCE_ANALYSIS_MODEL } from './analysis/analysis.model';
import { AnalysisService } from './analysis/analysis.service';
import { MockEvidenceAnalysisModel } from './analysis/mock-analysis.model';
import { llmConfigured, OpenAiEvidenceAnalysisModel } from './analysis/openai-analysis.model';
import { FollowUpService } from './follow-up.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

// Evidence of one onboarding case, its analysis and the follow-up task.
@Module({
  imports: [DatabaseModule],
  controllers: [OnboardingController],
  providers: [
    AnalysisService,
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
export class OnboardingModule {}
