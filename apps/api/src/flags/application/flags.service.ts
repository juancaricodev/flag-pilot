import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFlagDto } from '../presentation/dtos/create-flag.dto';
import { UpdateFlagDto } from '../presentation/dtos/update-flag.dto';
import type { Flag } from '@fp/shared';

@Injectable()
export class FlagsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.toFlag(flag);
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
    await this.findOne(id);

    const flag = await this.prisma.flag.update({
      where: { id },
      data: dto,
    });

    return this.toFlag(flag);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.flag.delete({ where: { id } });
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
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString(),
    };
  }
}
