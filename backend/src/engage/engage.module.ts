import { Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { ActionAdvisor } from "./ai/advisor";
import { ACTION_LLM_CLIENT, ClaudeClient } from "./ai/claude-client";
import { CasesController } from "./cases/cases.controller";
import { StaffingController } from "./cases/staffing.controller";
import { closeStorage, initStorage } from "./db/repository";

// Role dashboards: cases, workflow records and staffing requests.
@Module({
  controllers: [CasesController, StaffingController],
  providers: [
    ActionAdvisor,
    ClaudeClient,
    { provide: ACTION_LLM_CLIENT, useExisting: ClaudeClient },
  ],
})
export class EngageModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await initStorage();
  }

  async onModuleDestroy(): Promise<void> {
    await closeStorage();
  }
}
