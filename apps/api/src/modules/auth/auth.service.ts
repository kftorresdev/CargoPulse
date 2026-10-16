import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto.js';
import { Role } from '@prisma/client';

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

// Pre-computed bcrypt hash of 'Password123!' (10 salt rounds)
export const DEMO_PASSWORD_HASH =
  '$2b$10$oulg4BbUeEUkpDeMfQ0GsuI2R7tK2bIpd4Qkx22kCAeb7RaWZSJ7q';

export const DEMO_USERS: DemoUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@cargopulse.com',
    passwordHash: DEMO_PASSWORD_HASH,
    firstName: 'Kevin',
    lastName: 'Torres',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'operator@cargopulse.com',
    passwordHash: DEMO_PASSWORD_HASH,
    firstName: 'Carlos',
    lastName: 'Mendoza',
    role: Role.LOGISTICS_OPERATOR,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'auditor@cargopulse.com',
    passwordHash: DEMO_PASSWORD_HASH,
    firstName: 'Elena',
    lastName: 'Rivas',
    role: Role.FREIGHT_AUDITOR,
    isActive: true,
    createdAt: new Date(),
  },
];

@Injectable()
export class AuthService {
  public static readonly DEMO_USERS: DemoUser[] = DEMO_USERS;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!this.prisma.isConnected) {
      throw new ConflictException(
        'Database connection is offline. Registration is unavailable in fallback mode.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || Role.LOGISTICS_OPERATOR,
        isActive: true,
      },
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

    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const emailLower = dto.email.toLowerCase();
    let user: {
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: Role;
      isActive: boolean;
      createdAt: Date;
    } | null = null;

    if (this.prisma.isConnected) {
      try {
        user = await this.prisma.user.findUnique({
          where: { email: emailLower },
        });
      } catch (error) {
        this.logger.warn(
          `Database query failed during login for ${emailLower}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo users.`,
        );
        user = null;
      }
    }

    if (!user) {
      const demoUser = DEMO_USERS.find((u) => u.email === emailLower);
      if (demoUser) {
        user = demoUser;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sanitizedUser: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    const accessToken = await this.generateToken(sanitizedUser);

    return {
      accessToken,
      user: sanitizedUser,
    };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    let user: UserProfileDto | null = null;

    if (this.prisma.isConnected) {
      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
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
          `Database query failed during getProfile for ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo users.`,
        );
        user = null;
      }
    }

    if (!user) {
      const demoUser = DEMO_USERS.find((u) => u.id === userId);
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateToken(user: UserProfileDto): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
