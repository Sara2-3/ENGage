import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";
import { DatabaseService } from "./database.service";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  controllers: [HealthController, OnboardingController],
  providers: [DatabaseService, OnboardingService],
})
export class AppModule {}
