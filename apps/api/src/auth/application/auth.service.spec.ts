import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    admin: {
      findUnique: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockAdmin = {
    id: 'admin-1',
    email: 'admin@flagpilot.dev',
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  // ---------------------------------------------------------------------------
  // login(email, password)
  // ---------------------------------------------------------------------------
  describe('login', () => {
    it('returns an access token when credentials are valid', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync.mockResolvedValue('jwt-token-123');

      const result = await service.login('admin@flagpilot.dev', 'admin123');

      expect(result).toEqual({ accessToken: 'jwt-token-123' });
      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@flagpilot.dev' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', mockAdmin.passwordHash);
      expect(mockJwt.signAsync).toHaveBeenCalledWith({
        sub: 'admin-1',
        email: 'admin@flagpilot.dev',
      });
    });

    it('throws UnauthorizedException when email does not exist', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown@email.com', 'any-password')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'unknown@email.com' },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('admin@flagpilot.dev', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', mockAdmin.passwordHash);
      expect(mockJwt.signAsync).not.toHaveBeenCalled();
    });

    it('does not reveal whether email exists or password is wrong', async () => {
      // Both cases should throw the same error message
      mockPrisma.admin.findUnique.mockResolvedValue(null);
      const noEmailError = await getErrorAsync(() =>
        service.login('unknown@email.com', 'any-password'),
      );

      mockPrisma.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const wrongPasswordError = await getErrorAsync(() =>
        service.login('admin@flagpilot.dev', 'wrong-password'),
      );

      expect(noEmailError?.message).toBe(wrongPasswordError?.message);
    });
  });

  // ---------------------------------------------------------------------------
  // validateToken(token)
  // ---------------------------------------------------------------------------
  describe('validateToken', () => {
    it('returns the payload when token is valid', async () => {
      const payload = { sub: 'admin-1', email: 'admin@flagpilot.dev' };
      mockJwt.verifyAsync.mockResolvedValue(payload);

      const result = await service.validateToken('valid-jwt');

      expect(result).toEqual(payload);
      expect(mockJwt.verifyAsync).toHaveBeenCalledWith('valid-jwt');
    });

    it('throws UnauthorizedException when token is invalid', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.validateToken('invalid-jwt')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is expired', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.validateToken('expired-jwt')).rejects.toThrow(UnauthorizedException);
    });
  });
});

// Helper to extract error from rejected promise
async function getErrorAsync(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as Error;
  }
}
