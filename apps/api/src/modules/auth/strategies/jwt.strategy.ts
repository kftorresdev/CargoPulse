import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service.js';
import { UserProfileDto } from '../dto/auth-response.dto.js';
import { DEMO_USERS } from '../auth.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'cargopulse-enterprise-secret-key-2026'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserProfileDto> {
    let user: UserProfileDto | null = null;

    if (this.prisma.isConnected) {
      try {
        user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });
      } catch (error) {
        this.logger.warn(
          `Database query failed during JWT validation for user ${payload.sub}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo users.`,
        );
        user = null;
      }
    }

    if (!user) {
      const demoUser = DEMO_USERS.find((u) => u.id === payload.sub);
      if (demoUser) {
        user = {
          id: demoUser.id,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          isActive: demoUser.isActive,
          createdAt: demoUser.createdAt,
        };
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not authorized or account is inactive');
    }

    return user;
  }
}
