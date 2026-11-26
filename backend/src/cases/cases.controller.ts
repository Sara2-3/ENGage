import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { CasesService } from './cases.service';
import { CaseEventDto, CreateCaseDto, ReviewDto } from './DTO/case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  public async findAll() {
    return this.casesService.findAll();
  }

  @Post()
  public async create(@Body() body: CreateCaseDto) {
    return this.casesService.create(body);
  }

  @Post(':id/events')
  public async addRecord(@Param('id') id: string, @Body() body: CaseEventDto) {
    return this.casesService.addRecord(id, body);
  }

  @Get(':id/cv')
  public async cv(@Param('id') id: string, @Query('role') role?: string) {
    return this.casesService.cv(id, role);
  }

  @Post(':id/cv')
  public async uploadCv(@Param('id') id: string, @Query('role') role: string, @Req() req: { body: unknown }) {
    return this.casesService.uploadCv(id, role, req.body);
  }

  // Before ':id', so that "overview" is not read as a case id.
  @Get('overview')
  public async overview() {
    return this.casesService.overview();
  }

  @Get(':id')
  public async findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Post(':id/advice')
  public async advice(@Param('id') id: string) {
    return this.casesService.advice(id);
  }

  @Post(':id/reviews')
  public async review(@Param('id') id: string, @Body() body: ReviewDto) {
    return this.casesService.review(id, body);
  }
}
