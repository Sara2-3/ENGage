import { Module } from '@nestjs/common';

import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

// Cases and workflow records behind the role dashboards.
@Module({
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
