import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { FlagsService } from '../application/flags.service';
import { CreateFlagDto } from './dtos/create-flag.dto';
import { UpdateFlagDto } from './dtos/update-flag.dto';
import type { Flag, AuditLogEntry } from '@fp/shared';

@Controller('api/flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post()
  create(@Body() dto: CreateFlagDto): Promise<Flag> {
    return this.flagsService.create(dto);
  }

  @Get()
  findAll(): Promise<Flag[]> {
    return this.flagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Flag> {
    return this.flagsService.findOne(id);
  }

  @Get(':id/audit')
  getAuditLogs(@Param('id') id: string): Promise<AuditLogEntry[]> {
    return this.flagsService.getAuditLogs(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFlagDto): Promise<Flag> {
    return this.flagsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.flagsService.remove(id);
  }
}
