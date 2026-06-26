import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      email: admin.email,
    });

    return { accessToken };
  }

  async validateToken(token: string): Promise<{ sub: string; email: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
