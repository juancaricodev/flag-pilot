import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EvaluationService', () => {
  let service: EvaluationService;

  const mockPrisma = {
    flag: {
      findUnique: jest.fn(),
    },
    evaluation: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaluationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // stickyHash (private — tested through (any) cast, pure function)
  // ---------------------------------------------------------------------------
  describe('stickyHash', () => {
    const hash = (userId: string, flagId: string): number =>
      (service as any).stickyHash(userId, flagId);

    it('returns same result for same userId and same flagId (deterministic)', () => {
      const result1 = hash('user-123', 'flag-dark-mode');
      const result2 = hash('user-123', 'flag-dark-mode');
      const result3 = hash('user-123', 'flag-dark-mode');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('returns different results for different userIds', () => {
      const results = new Set(
        Array.from({ length: 50 }, (_, i) => hash(`user-${i}`, 'flag-dark-mode')),
      );
      // With 50 users, we expect at least some variety
      expect(results.size).toBeGreaterThan(1);
    });

    it('returns different results for same userId with different flagIds', () => {
      const results = new Set(Array.from({ length: 50 }, (_, i) => hash('user-1', `flag-${i}`)));
      expect(results.size).toBeGreaterThan(1);
    });

    it('always returns a number between 0 and 99', () => {
      for (let i = 0; i < 1000; i++) {
        const result = hash(`user-${i}`, 'flag-dark-mode');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(99);
      }
    });

    it('distributes roughly uniformly across 0-99', () => {
      const bucketSize = 10000;
      const counts = new Array(100).fill(0);

      for (let i = 0; i < bucketSize; i++) {
        const h = hash(`user-${i}`, 'some-flag');
        counts[h]++;
      }

      // Each bucket should have roughly bucketSize/100 = 100 entries
      // Allow ±50% tolerance for this test (non-cryptographic hash)
      for (let i = 0; i < 100; i++) {
        expect(counts[i]).toBeGreaterThan(0);
        // Reasonable lower bound — with 10k users, even the least populated
        // bucket should get at least 0.25% (25 entries)
        expect(counts[i]).toBeGreaterThan(bucketSize * 0.0025);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // evaluate(flagName) — simple evaluation without user context
  // ---------------------------------------------------------------------------
  describe('evaluate', () => {
    it('returns false when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      const result = await service.evaluate('non-existent-flag');

      expect(result).toBe(false);
      expect(mockPrisma.flag.findUnique).toHaveBeenCalledWith({
        where: { name: 'non-existent-flag' },
      });
    });

    it('does NOT record an evaluation event when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      await service.evaluate('non-existent-flag');

      expect(mockPrisma.evaluation.create).not.toHaveBeenCalled();
    });

    it('returns flag.enabled when flag exists and is enabled', async () => {
      const flag = { id: 'flag-1', name: 'dark-mode', enabled: true };
      mockPrisma.flag.findUnique.mockResolvedValue(flag);
      mockPrisma.evaluation.create.mockResolvedValue({});

      const result = await service.evaluate('dark-mode');

      expect(result).toBe(true);
    });

    it('returns flag.enabled when flag exists and is disabled', async () => {
      const flag = { id: 'flag-1', name: 'dark-mode', enabled: false };
      mockPrisma.flag.findUnique.mockResolvedValue(flag);
      mockPrisma.evaluation.create.mockResolvedValue({});

      const result = await service.evaluate('dark-mode');

      expect(result).toBe(false);
    });

    it('records an evaluation event when flag exists', async () => {
      const flag = { id: 'flag-1', name: 'dark-mode', enabled: true };
      mockPrisma.flag.findUnique.mockResolvedValue(flag);
      mockPrisma.evaluation.create.mockResolvedValue({});

      await service.evaluate('dark-mode');

      expect(mockPrisma.evaluation.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-1',
          userId: null,
          result: true,
        },
      });
    });

    it('returns false for non-existent flag — safe default (UC-09 edge case)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      const result = await service.evaluate('unknown-flag');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateWithContext(flagName, userId) — context-aware evaluation
  // ---------------------------------------------------------------------------
  describe('evaluateWithContext', () => {
    it('returns false when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      const result = await service.evaluateWithContext('unknown-flag', 'user-1');

      expect(result).toBe(false);
    });

    it('does NOT record an evaluation event when flag does not exist', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);

      await service.evaluateWithContext('unknown-flag', 'user-1');

      expect(mockPrisma.evaluation.create).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // resolveFlag scenarios (tested through evaluateWithContext)
    // -----------------------------------------------------------------------
    describe('resolveFlag precedence', () => {
      it('returns true when user is whitelisted even if flag is disabled (UC-07)', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: false,
          rolloutPct: 0,
          whitelist: ['user-whitelisted'],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        const result = await service.evaluateWithContext('feature-x', 'user-whitelisted');

        expect(result).toBe(true);
      });

      it('returns true when user is whitelisted even if rollout is 0', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: true,
          rolloutPct: 0,
          whitelist: ['user-whitelisted'],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        const result = await service.evaluateWithContext('feature-x', 'user-whitelisted');

        expect(result).toBe(true);
      });

      it('returns false when flag is disabled and user is not whitelisted', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: false,
          rolloutPct: 50,
          whitelist: [],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        const result = await service.evaluateWithContext('feature-x', 'regular-user');

        expect(result).toBe(false);
      });

      it('returns false when rollout is 0 and user is not whitelisted', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: true,
          rolloutPct: 0,
          whitelist: [],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        const result = await service.evaluateWithContext('feature-x', 'regular-user');

        expect(result).toBe(false);
      });

      it('returns true when rollout is 100 and flag is enabled', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: true,
          rolloutPct: 100,
          whitelist: [],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        const result = await service.evaluateWithContext('feature-x', 'any-user');

        expect(result).toBe(true);
      });

      it('uses sticky hash when rollout is between 1 and 99', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: true,
          rolloutPct: 50,
          whitelist: [],
        };
        mockPrisma.flag.findUnique.mockResolvedValue(flag);
        mockPrisma.evaluation.create.mockResolvedValue({});

        // Test that the same user always gets the same result (sticky)
        const results: boolean[] = [];
        for (let i = 0; i < 20; i++) {
          const r = await service.evaluateWithContext('feature-x', 'sticky-user');
          results.push(r);
        }

        // All results should be identical (sticky)
        expect(results.every((r) => r === results[0])).toBe(true);
      });

      it('can return both true and false for different users at 50% rollout', async () => {
        const flag = {
          id: 'flag-1',
          name: 'feature-x',
          enabled: true,
          rolloutPct: 50,
          whitelist: [],
        };

        // Evaluate 100 different users and check we get both true and false
        const results = new Set<boolean>();
        for (let i = 0; i < 100; i++) {
          mockPrisma.flag.findUnique.mockResolvedValue(flag);

          const r = await service.evaluateWithContext('feature-x', `user-${i}`);
          results.add(r);
        }

        // With 100 users at 50%, we should definitely see both true and false
        expect(results.has(true)).toBe(true);
        expect(results.has(false)).toBe(true);
      });
    });

    it('records evaluation event with userId', async () => {
      const flag = {
        id: 'flag-1',
        name: 'feature-x',
        enabled: true,
        rolloutPct: 100,
        whitelist: [],
      };
      mockPrisma.flag.findUnique.mockResolvedValue(flag);
      mockPrisma.evaluation.create.mockResolvedValue({});

      await service.evaluateWithContext('feature-x', 'user-456');

      expect(mockPrisma.evaluation.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-1',
          userId: 'user-456',
          result: true,
        },
      });
    });
  });
});
