import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/application/audit.service';
import { FlagCacheService } from '../../flag-cache/flag-cache.service';
import { CreateFlagDto } from '../presentation/dtos/create-flag.dto';
import { UpdateFlagDto } from '../presentation/dtos/update-flag.dto';
import type { Flag, AuditLogEntry, FlagStatus } from '@fp/shared';

@Injectable()
export class FlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly flagCache: FlagCacheService,
  ) {}

  async create(dto: CreateFlagDto): Promise<Flag> {
    const existing = await this.prisma.flag.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Flag "${dto.name}" already exists`);
    }

    const flag = await this.prisma.flag.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        enabled: dto.enabled ?? false,
        rolloutPct: dto.rolloutPct ?? 0,
      },
    });

    // Eager invalidation (D5): del AFTER the successful write — a re-created
    // flag must not be served from a stale cached config.
    await this.invalidate(dto.name);

    const result = this.toFlag(flag);

    await this.audit.log({
      flagId: flag.id,
      action: 'CREATE',
      toState: this.snapshot(result),
    });

    return result;
  }

  async findAll(): Promise<Flag[]> {
    const flags = await this.prisma.flag.findMany({ orderBy: { updatedAt: 'desc' } });
    return flags.map((f) => this.toFlag(f));
  }

  async findOne(id: string): Promise<Flag> {
    const flag = await this.prisma.flag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException(`Flag with id "${id}" not found`);
    }
    return this.toFlag(flag);
  }

  async update(id: string, dto: UpdateFlagDto): Promise<Flag> {
    const before = await this.findOne(id);

    const flag = await this.prisma.flag.update({
      where: { id },
      data: dto,
    });

    // Eager invalidation (D5): del both keys — rename-safe. When the name is
    // unchanged the double-del is harmless. Runs AFTER the successful write.
    await this.invalidate(before.name);
    await this.invalidate(flag.name);

    const result = this.toFlag(flag);

    const enabledChanged = dto.enabled !== undefined && dto.enabled !== before.enabled;
    const action = enabledChanged ? 'TOGGLE' : 'UPDATE';

    await this.audit.log({
      flagId: id,
      action,
      fromState: this.snapshot(before),
      toState: this.snapshot(result),
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    const before = await this.findOne(id);

    await this.audit.log({
      flagId: id,
      action: 'DELETE',
      fromState: this.snapshot(before),
    });

    await this.prisma.flag.delete({ where: { id } });

    // Eager invalidation (D5): del AFTER the successful delete — a removed
    // flag must not keep answering `true` from a cached config.
    await this.invalidate(before.name);
  }

  /**
   * Invalidate the cached config for a flag name.
   *
   * FlagCacheService already guarantees del never throws (degrade to stale
   * until the 30s TTL). This call-site catch is belt-and-braces so a cache
   * hiccup can never fail an admin mutation that already succeeded in the DB.
   */
  private async invalidate(name: string): Promise<void> {
    try {
      await this.flagCache.del(name);
    } catch {
      // Redis down → stale entry expires within the 30s TTL backstop
    }
  }

  async getAuditLogs(flagId: string): Promise<AuditLogEntry[]> {
    return this.audit.findByFlagId(flagId);
  }

  private snapshot(flag: Flag): Record<string, unknown> {
    return {
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPct: flag.rolloutPct,
      whitelist: flag.whitelist,
    };
  }

  private computeStatus(enabled: boolean, rolloutPct: number): FlagStatus {
    if (!enabled) return 'disabled';
    if (rolloutPct > 0 && rolloutPct < 100) return 'partial';
    return 'enabled';
  }

  private toFlag(flag: {
    id: string;
    name: string;
    description: string | null;
    enabled: boolean;
    rolloutPct: number;
    whitelist: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Flag {
    return {
      id: flag.id,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPct: flag.rolloutPct,
      whitelist: flag.whitelist,
      status: this.computeStatus(flag.enabled, flag.rolloutPct),
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString(),
    };
  }
}
