import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const rawEntry = {
    id: 'audit-1',
    flagId: 'flag-1',
    action: 'CREATE',
    fromState: null,
    toState: JSON.stringify({ name: 'dark-mode', enabled: false }),
    reason: null,
    createdAt: new Date('2026-06-25T10:00:00Z'),
  };

  const rawEntryWithState = {
    ...rawEntry,
    fromState: JSON.stringify({ name: 'dark-mode', enabled: false }),
    toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
    reason: 'Initial creation',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // log(params)
  // ---------------------------------------------------------------------------
  describe('log', () => {
    it('creates an audit entry with all params and returns AuditLogEntry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntry);

      const result = await service.log({
        flagId: 'flag-1',
        action: 'CREATE',
        toState: { name: 'dark-mode', enabled: false },
      });

      expect(result).toEqual({
        id: 'audit-1',
        flagId: 'flag-1',
        action: 'CREATE',
        fromState: null,
        toState: JSON.stringify({ name: 'dark-mode', enabled: false }),
        reason: null,
        createdAt: '2026-06-25T10:00:00.000Z',
      });
    });

    it('stringifies fromState when provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntryWithState);

      await service.log({
        flagId: 'flag-1',
        action: 'UPDATE',
        fromState: { name: 'dark-mode', enabled: false },
        toState: { name: 'dark-mode', enabled: true },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-1',
          action: 'UPDATE',
          fromState: JSON.stringify({ name: 'dark-mode', enabled: false }),
          toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
          reason: null,
        },
      });
    });

    it('sets fromState to null when not provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntry);

      await service.log({
        flagId: 'flag-1',
        action: 'CREATE',
        toState: { name: 'dark-mode', enabled: false },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-1',
          action: 'CREATE',
          fromState: null,
          toState: JSON.stringify({ name: 'dark-mode', enabled: false }),
          reason: null,
        },
      });
    });

    it('sets toState to null when not provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntry);

      await service.log({
        flagId: 'flag-1',
        action: 'DELETE',
        fromState: { name: 'dark-mode', enabled: true },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-1',
          action: 'DELETE',
          fromState: JSON.stringify({ name: 'dark-mode', enabled: true }),
          toState: null,
          reason: null,
        },
      });
    });

    it('defaults reason to null when not provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntry);

      await service.log({
        flagId: 'flag-1',
        action: 'TOGGLE',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: null }),
        }),
      );
    });

    it('uses provided reason when given', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        ...rawEntry,
        reason: 'Enabled for testing',
      });

      await service.log({
        flagId: 'flag-1',
        action: 'TOGGLE',
        reason: 'Enabled for testing',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: 'Enabled for testing' }),
        }),
      );
    });

    it('calls prisma.auditLog.create with the correct data', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(rawEntry);

      await service.log({
        flagId: 'flag-1',
        action: 'CREATE',
        toState: { name: 'dark-mode', enabled: false },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findByFlagId(flagId)
  // ---------------------------------------------------------------------------
  describe('findByFlagId', () => {
    it('returns an empty array when no audit logs exist', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await service.findByFlagId('flag-1');

      expect(result).toEqual([]);
    });

    it('returns audit logs ordered by createdAt desc for a given flagId', async () => {
      const newerEntry = {
        ...rawEntry,
        id: 'audit-2',
        createdAt: new Date('2026-06-25T11:00:00Z'),
      };
      mockPrisma.auditLog.findMany.mockResolvedValue([newerEntry, rawEntry]);

      const result = await service.findByFlagId('flag-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('audit-2');
      expect(result[1].id).toBe('audit-1');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { flagId: 'flag-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('converts Date to ISO string in the result', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([rawEntry]);

      const result = await service.findByFlagId('flag-1');

      expect(result[0].createdAt).toBe('2026-06-25T10:00:00.000Z');
      expect(typeof result[0].createdAt).toBe('string');
    });

    it('casts action string to AuditAction type', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([rawEntry]);

      const result = await service.findByFlagId('flag-1');

      // Action should be one of the allowed AuditAction values
      expect(['CREATE', 'TOGGLE', 'UPDATE', 'DELETE']).toContain(result[0].action);
    });
  });
});
