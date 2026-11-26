import { Module } from '@nestjs/common';

import { CasesModule } from '../cases/cases.module';
import { StaffingController } from './staffing.controller';
import { StaffingService } from './staffing.service';

@Module({
  imports: [CasesModule],
  controllers: [StaffingController],
  providers: [StaffingService],
})
export class StaffingModule {}
