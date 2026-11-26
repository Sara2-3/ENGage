import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { StaffingModule } from './staffing/staffing.module';

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, CasesModule, StaffingModule, OnboardingModule],
})
export class AppModule {}
