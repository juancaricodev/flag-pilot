import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/application/audit.service';

describe('FlagsService', () => {
  let service: FlagsService;

  const mockPrisma = {
    flag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn(),
    findByFlagId: jest.fn(),
  };

  // Shared test fixtures
  const rawFlag = {
    id: 'flag-1',
    name: 'dark-mode',
    description: 'Enable dark mode',
    enabled: false,
    rolloutPct: 0,
    whitelist: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlagsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<FlagsService>(FlagsService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create(dto)
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('creates a flag successfully with valid data (UC-01 happy path)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue(rawFlag);
      mockAudit.log.mockResolvedValue({});

      const result = await service.create({
        name: 'dark-mode',
        description: 'Enable dark mode',
      });

      expect(result).toMatchObject({
        id: 'flag-1',
        name: 'dark-mode',
        description: 'Enable dark mode',
        enabled: false,
      });
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }));
    });

    it('throws ConflictException when flag name already exists (UC-01 edge case)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);

      await expect(service.create({ name: 'dark-mode' })).rejects.toThrow(ConflictException);

      expect(mockPrisma.flag.create).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalled();
    });

    it('defaults enabled to false when not provided', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue(rawFlag);
      mockAudit.log.mockResolvedValue({});

      await service.create({ name: 'dark-mode' });

      expect(mockPrisma.flag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: false }),
        }),
      );
    });

    it('uses provided enabled value when given', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue({ ...rawFlag, enabled: true });
      mockAudit.log.mockResolvedValue({});

      await service.create({ name: 'dark-mode', enabled: true });

      expect(mockPrisma.flag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: true }),
        }),
      );
    });

    it('defaults rolloutPct to 0 when not provided', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue(rawFlag);
      mockAudit.log.mockResolvedValue({});

      await service.create({ name: 'dark-mode' });

      expect(mockPrisma.flag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rolloutPct: 0 }),
        }),
      );
    });

    it('uses provided rolloutPct when given', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue({ ...rawFlag, rolloutPct: 75 });
      mockAudit.log.mockResolvedValue({});

      await service.create({ name: 'dark-mode', rolloutPct: 75 });

      expect(mockPrisma.flag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rolloutPct: 75 }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll()
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('returns an empty array when no flags exist (UC-02 edge case)', async () => {
      mockPrisma.flag.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('returns all flags ordered by updatedAt desc (UC-02 happy path)', async () => {
      const flag1 = { ...rawFlag, id: 'flag-1', name: 'alpha' };
      const flag2 = { ...rawFlag, id: 'flag-2', name: 'beta' };
      mockPrisma.flag.findMany.mockResolvedValue([flag1, flag2]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('alpha');
      expect(mockPrisma.flag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { updatedAt: 'desc' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findOne(id)
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('returns the flag when found', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);

      const result = await service.findOne('flag-1');

      expect(result.id).toBe('flag-1');
      expect(result.name).toBe('dark-mode');
    });

    it('throws NotFoundException when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // update(id, dto)
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const updateDto = { enabled: true };

    it('updates flag and returns the result', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);
      mockPrisma.flag.update.mockResolvedValue({ ...rawFlag, enabled: true });
      mockAudit.log.mockResolvedValue({});

      const result = await service.update('flag-1', updateDto);

      expect(result.enabled).toBe(true);
      expect(mockPrisma.flag.update).toHaveBeenCalledWith({
        where: { id: 'flag-1' },
        data: updateDto,
      });
    });

    it('logs TOGGLE action when enabled field changes (UC-03)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);
      mockPrisma.flag.update.mockResolvedValue({ ...rawFlag, enabled: true });
      mockAudit.log.mockResolvedValue({});

      await service.update('flag-1', updateDto);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TOGGLE',
          fromState: expect.any(Object),
          toState: expect.any(Object),
        }),
      );
    });

    it('logs UPDATE action when non-toggle fields change', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);
      mockPrisma.flag.update.mockResolvedValue({ ...rawFlag, description: 'new desc' });
      mockAudit.log.mockResolvedValue({});

      await service.update('flag-1', { description: 'new desc' });

      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('logs UPDATE when enabled is provided but unchanged (regression: unchanged-enabled edge case)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag); // enabled: false
      mockPrisma.flag.update.mockResolvedValue({ ...rawFlag, description: 'new desc' });
      mockAudit.log.mockResolvedValue({});

      await service.update('flag-1', { description: 'new desc', enabled: false });

      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('logs UPDATE when enabled true stays true alongside other changes (triangulation)', async () => {
      const enabledFlag = { ...rawFlag, enabled: true };
      mockPrisma.flag.findUnique.mockResolvedValue(enabledFlag);
      mockPrisma.flag.update.mockResolvedValue({ ...enabledFlag, rolloutPct: 50 });
      mockAudit.log.mockResolvedValue({});

      await service.update('flag-1', { rolloutPct: 50, enabled: true });

      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('throws NotFoundException when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.flag.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove(id)
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('deletes flag and logs DELETE action (UC-04 happy path)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(rawFlag);
      mockPrisma.flag.delete.mockResolvedValue(rawFlag);
      mockAudit.log.mockResolvedValue({});

      await service.remove('flag-1');

      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
      expect(mockPrisma.flag.delete).toHaveBeenCalledWith({
        where: { id: 'flag-1' },
      });
    });

    it('throws NotFoundException when flag does not exist (UC-04 edge case)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.flag.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getAuditLogs(flagId)
  // ---------------------------------------------------------------------------
  describe('getAuditLogs', () => {
    it('delegates to audit service (UC-05)', async () => {
      const auditLogs = [
        {
          id: 'audit-1',
          flagId: 'flag-1',
          action: 'CREATE',
          fromState: null,
          toState: '{}',
          reason: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockAudit.findByFlagId.mockResolvedValue(auditLogs);

      const result = await service.getAuditLogs('flag-1');

      expect(result).toEqual(auditLogs);
      expect(mockAudit.findByFlagId).toHaveBeenCalledWith('flag-1');
    });
  });
});
