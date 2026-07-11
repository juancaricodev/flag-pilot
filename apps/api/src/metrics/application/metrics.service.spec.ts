import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;

  const mockPrisma = {
    evaluation: {
      groupBy: jest.fn(),
    },
    flag: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('returns evaluations grouped by flag with total, enabled, and disabled counts', async () => {
      mockPrisma.evaluation.groupBy
        .mockResolvedValueOnce([
          { flagId: 'flag-1', _count: { id: 100 } },
          { flagId: 'flag-2', _count: { id: 50 } },
        ])
        .mockResolvedValueOnce([
          { flagId: 'flag-1', _count: { id: 70 } },
          { flagId: 'flag-2', _count: { id: 20 } },
        ]);
      mockPrisma.flag.findMany.mockResolvedValue([
        { id: 'flag-1', name: 'dark-mode' },
        { id: 'flag-2', name: 'new-checkout' },
      ]);

      const result = await service.getMetrics();

      expect(result).toEqual({
        totalEvaluations: 150,
        flags: [
          { flagId: 'flag-1', flagName: 'dark-mode', total: 100, enabled: 70, disabled: 30 },
          { flagId: 'flag-2', flagName: 'new-checkout', total: 50, enabled: 20, disabled: 30 },
        ],
      });
    });

    it('returns empty summary when no evaluations exist', async () => {
      mockPrisma.evaluation.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockPrisma.flag.findMany.mockResolvedValue([]);

      const result = await service.getMetrics();

      expect(result).toEqual({
        totalEvaluations: 0,
        flags: [],
      });
    });

    it('returns flagName as "Unknown" when flag is not found in database', async () => {
      mockPrisma.evaluation.groupBy
        .mockResolvedValueOnce([{ flagId: 'flag-orphan', _count: { id: 10 } }])
        .mockResolvedValueOnce([{ flagId: 'flag-orphan', _count: { id: 5 } }]);
      mockPrisma.flag.findMany.mockResolvedValue([]);

      const result = await service.getMetrics();

      expect(result.flags[0].flagName).toBe('Unknown');
      expect(result.flags[0].total).toBe(10);
      expect(result.flags[0].enabled).toBe(5);
      expect(result.flags[0].disabled).toBe(5);
    });

    it('calls Prisma groupBy with correct parameters for both queries', async () => {
      mockPrisma.evaluation.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockPrisma.flag.findMany.mockResolvedValue([]);

      await service.getMetrics();

      expect(mockPrisma.evaluation.groupBy).toHaveBeenCalledTimes(2);
      expect(mockPrisma.evaluation.groupBy).toHaveBeenNthCalledWith(1, {
        by: ['flagId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });
      expect(mockPrisma.evaluation.groupBy).toHaveBeenNthCalledWith(2, {
        by: ['flagId'],
        _count: { id: true },
        where: { result: true },
      });
    });

    it('computes disabled as total minus enabled', async () => {
      mockPrisma.evaluation.groupBy
        .mockResolvedValueOnce([{ flagId: 'flag-1', _count: { id: 200 } }])
        .mockResolvedValueOnce([{ flagId: 'flag-1', _count: { id: 200 } }]);
      mockPrisma.flag.findMany.mockResolvedValue([{ id: 'flag-1', name: 'all-enabled' }]);

      const result = await service.getMetrics();

      expect(result.flags[0].total).toBe(200);
      expect(result.flags[0].enabled).toBe(200);
      expect(result.flags[0].disabled).toBe(0);
    });

    it('handles flag with no enabled evaluations', async () => {
      mockPrisma.evaluation.groupBy
        .mockResolvedValueOnce([{ flagId: 'flag-1', _count: { id: 30 } }])
        .mockResolvedValueOnce([]);
      mockPrisma.flag.findMany.mockResolvedValue([{ id: 'flag-1', name: 'all-disabled' }]);

      const result = await service.getMetrics();

      expect(result.flags[0].total).toBe(30);
      expect(result.flags[0].enabled).toBe(0);
      expect(result.flags[0].disabled).toBe(30);
    });
  });
});
