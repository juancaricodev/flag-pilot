import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../../application/auth.service';

function mockExecutionContext(cookies: Record<string, string> | undefined) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies }),
    }),
  } as any;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jest.Mocked<AuthService>;

  const validPayload = { sub: 'admin-1', email: 'admin@flagpilot.dev' };

  beforeEach(() => {
    mockAuthService = {
      validateToken: jest.fn(),
    } as any;

    guard = new AuthGuard(mockAuthService);
  });

  // ---------------------------------------------------------------------------
  // canActivate
  // ---------------------------------------------------------------------------
  describe('canActivate', () => {
    it('returns true when token is valid', async () => {
      mockAuthService.validateToken.mockResolvedValue(validPayload);

      const context = mockExecutionContext({ access_token: 'valid-jwt' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-jwt');
    });

    it('attaches the decoded payload to request.user', async () => {
      mockAuthService.validateToken.mockResolvedValue(validPayload);

      const request = { cookies: { access_token: 'valid-jwt' } };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as any;

      await guard.canActivate(context);

      expect((request as any).user).toEqual(validPayload);
    });

    it('throws UnauthorizedException when access_token cookie is missing', async () => {
      const context = mockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Missing access token');
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when access_token cookie is empty', async () => {
      const context = mockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Missing access token');
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when token is invalid', async () => {
      mockAuthService.validateToken.mockRejectedValue(new UnauthorizedException('Invalid token'));

      const context = mockExecutionContext({ access_token: 'invalid-jwt' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid-jwt');
    });

    it('throws UnauthorizedException when token is expired', async () => {
      mockAuthService.validateToken.mockRejectedValue(new UnauthorizedException('Invalid token'));

      const context = mockExecutionContext({ access_token: 'expired-jwt' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('expired-jwt');
    });

    it('does not leak the internal error message to the client', async () => {
      // AuthService.validateToken always throws 'Invalid token', never the raw JWT error
      mockAuthService.validateToken.mockRejectedValue(new UnauthorizedException('Invalid token'));

      const context = mockExecutionContext({ access_token: 'bad-token' });

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
    });
  });
});
