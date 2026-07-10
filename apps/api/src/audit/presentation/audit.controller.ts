import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { AuditService } from '../application/audit.service';
import type { AuditLogEntry } from '@fp/shared';

@UseGuards(AuthGuard)
@Controller('api/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(): Promise<AuditLogEntry[]> {
    return this.auditService.findAll();
  }
}
