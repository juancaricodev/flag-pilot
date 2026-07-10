import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuditLogEntry, AuditAction } from '@fp/shared';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    flagId: string;
    action: string;
    fromState?: Record<string, unknown> | null;
    toState?: Record<string, unknown> | null;
    reason?: string;
  }): Promise<AuditLogEntry> {
    const audit = await this.prisma.auditLog.create({
      data: {
        flagId: params.flagId,
        action: params.action,
        fromState: params.fromState ? JSON.stringify(params.fromState) : null,
        toState: params.toState ? JSON.stringify(params.toState) : null,
        reason: params.reason ?? null,
      },
      include: { flag: { select: { name: true } } },
    });

    return this.toEntry(audit, audit.flag);
  }

  async findAll(): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { flag: { select: { name: true } } },
    });
    return logs.map((e) => this.toEntry(e, e.flag));
  }

  async findByFlagId(flagId: string): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { flagId },
      orderBy: { createdAt: 'desc' },
      include: { flag: { select: { name: true } } },
    });
    return logs.map((e) => this.toEntry(e, e.flag));
  }

  private toEntry(
    audit: {
      id: string;
      flagId: string;
      action: string;
      fromState: string | null;
      toState: string | null;
      reason: string | null;
      createdAt: Date;
    },
    flag?: { name: string },
  ): AuditLogEntry {
    return {
      id: audit.id,
      flagId: audit.flagId,
      flagName: flag?.name,
      action: String(audit.action) as AuditAction,
      fromState: audit.fromState,
      toState: audit.toState,
      reason: audit.reason,
      createdAt: audit.createdAt.toISOString(),
    };
  }
}
