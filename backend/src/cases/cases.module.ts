import { Module } from '@nestjs/common';

import { ActionAdvisor } from './advisor';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ACTION_LLM_CLIENT, ClaudeClient } from './claude-client';
import { EvidenceExtractor } from './evidence-extractor';

// Cases and workflow records behind the role dashboards.
@Module({
  controllers: [CasesController],
  providers: [
    CasesService,
    ActionAdvisor,
    EvidenceExtractor,
    ClaudeClient,
    { provide: ACTION_LLM_CLIENT, useExisting: ClaudeClient },
  ],
  exports: [CasesService],
})
export class CasesModule {}
