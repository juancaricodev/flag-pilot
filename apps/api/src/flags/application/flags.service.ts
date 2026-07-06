import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/application/audit.service';
import { CreateFlagDto } from '../presentation/dtos/create-flag.dto';
import { UpdateFlagDto } from '../presentation/dtos/update-flag.dto';
import type { Flag, AuditLogEntry } from '@fp/shared';

@Injectable()
export class FlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
      },
    });

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

    const result = this.toFlag(flag);

    const action = dto.enabled !== undefined ? 'TOGGLE' : 'UPDATE';

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

  private computeStatus(enabled: boolean, rolloutPct: number): Flag['status'] {
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
