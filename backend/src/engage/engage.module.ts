import { Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { CasesController } from "./cases/cases.controller";
import { StaffingController } from "./cases/staffing.controller";
import { closeStorage, initStorage } from "./db/repository";

// Role dashboards: cases, workflow records and staffing requests.
@Module({ controllers: [CasesController, StaffingController] })
export class EngageModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await initStorage();
  }

  async onModuleDestroy(): Promise<void> {
    await closeStorage();
  }
}
