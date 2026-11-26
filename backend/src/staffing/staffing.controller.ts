import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { FillDto, HireDto } from './DTO/staffing.dto';
import { StaffingService } from './staffing.service';

@Controller('staffing')
export class StaffingController {
  constructor(private readonly staffingService: StaffingService) {}

  @Get()
  public async findAll() {
    return this.staffingService.findAll();
  }

  @Post()
  public async create(@Body() body: Record<string, unknown>) {
    return this.staffingService.create(body);
  }

  @Post('assign')
  public async assign(@Body() body: Record<string, unknown>) {
    return this.staffingService.assign(body);
  }

  @Post(':id/hire')
  public async hire(@Param('id') id: string, @Body() body: HireDto) {
    return this.staffingService.hire(Number(id), body);
  }

  @Post(':id/fill')
  public async fill(@Param('id') id: string, @Body() body: FillDto) {
    return this.staffingService.fill(Number(id), body);
  }
}
