import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService, DEMO_USERS } from './auth.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    isConnected: boolean;
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let jwtServiceMock: {
    signAsync: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      isConnected: false,
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: vi.fn().mockResolvedValue('signed-jwt-token-xyz'),
    };

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
    );
  });

  describe('DEMO_USERS constant', () => {
    it('should expose exactly 3 demo users matching specifications', () => {
      expect(DEMO_USERS).toHaveLength(3);
      expect(AuthService.DEMO_USERS).toBe(DEMO_USERS);

      const [admin, operator, auditor] = DEMO_USERS;

      expect(admin.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(admin.email).toBe('admin@cargopulse.com');
      expect(admin.firstName).toBe('Kevin');
      expect(admin.lastName).toBe('Torres');
      expect(admin.role).toBe(Role.ADMIN);
      expect(admin.isActive).toBe(true);

      expect(operator.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(operator.email).toBe('operator@cargopulse.com');
      expect(operator.firstName).toBe('Carlos');
      expect(operator.lastName).toBe('Mendoza');
      expect(operator.role).toBe(Role.LOGISTICS_OPERATOR);
      expect(operator.isActive).toBe(true);

      expect(auditor.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(auditor.email).toBe('auditor@cargopulse.com');
      expect(auditor.firstName).toBe('Elena');
      expect(auditor.lastName).toBe('Rivas');
      expect(auditor.role).toBe(Role.FREIGHT_AUDITOR);
      expect(auditor.isActive).toBe(true);
    });

    it('should verify password "Password123!" against demo user hashes', async () => {
      for (const demoUser of DEMO_USERS) {
        const matches = await bcrypt.compare('Password123!', demoUser.passwordHash);
        expect(matches).toBe(true);
      }
    });
  });

  describe('login - Offline Fallback Mode (!isConnected)', () => {
    it('should successfully authenticate admin demo user when DB is offline', async () => {
      prismaMock.isConnected = false;

      const result = await service.login({
        email: 'admin@cargopulse.com',
        password: 'Password123!',
      });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt-token-xyz');
      expect(result.user).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@cargopulse.com',
        firstName: 'Kevin',
        lastName: 'Torres',
        role: Role.ADMIN,
        isActive: true,
        createdAt: expect.any(Date),
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: '11111111-1111-1111-1111-111111111111',
        email: 'admin@cargopulse.com',
        role: Role.ADMIN,
      });
    });

    it('should normalize uppercase email during offline login', async () => {
      prismaMock.isConnected = false;

      const result = await service.login({
        email: 'OPERATOR@CargoPulse.COM',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('operator@cargopulse.com');
      expect(result.user.role).toBe(Role.LOGISTICS_OPERATOR);
    });

    it('should throw UnauthorizedException when password is wrong in offline mode', async () => {
      prismaMock.isConnected = false;

      await expect(
        service.login({
          email: 'auditor@cargopulse.com',
          password: 'IncorrectPassword!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });

    it('should throw UnauthorizedException when user does not exist in demo users', async () => {
      prismaMock.isConnected = false;

      await expect(
        service.login({
          email: 'unknown@cargopulse.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    });
  });

  describe('login - Online Database Mode (isConnected = true)', () => {
    it('should authenticate user from database when connected', async () => {
      prismaMock.isConnected = true;
      const hashedPassword = await bcrypt.hash('CustomSecret123!', 10);
      const dbUser = {
        id: 'custom-user-uuid',
        email: 'dbuser@cargopulse.com',
        passwordHash: hashedPassword,
        firstName: 'Database',
        lastName: 'User',
        role: Role.LOGISTICS_OPERATOR,
        isActive: true,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      };
      prismaMock.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.login({
        email: 'dbuser@cargopulse.com',
        password: 'CustomSecret123!',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'dbuser@cargopulse.com' },
      });
      expect(result.user.id).toBe('custom-user-uuid');
      expect(result.accessToken).toBe('signed-jwt-token-xyz');
    });

    it('should throw UnauthorizedException when db user is inactive', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'inactive-user',
        email: 'inactive@cargopulse.com',
        passwordHash: 'dummy-hash',
        firstName: 'Inactive',
        lastName: 'User',
        role: Role.ADMIN,
        isActive: false,
        createdAt: new Date(),
      });

      await expect(
        service.login({
          email: 'inactive@cargopulse.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('User account has been deactivated'));
    });

    it('should fallback to DEMO_USERS when DB query throws connection error', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockRejectedValue(new Error('Connection lost to PostgreSQL'));

      const result = await service.login({
        email: 'admin@cargopulse.com',
        password: 'Password123!',
      });

      expect(result.user.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.user.email).toBe('admin@cargopulse.com');
      expect(result.accessToken).toBe('signed-jwt-token-xyz');
    });

    it('should fallback to DEMO_USERS when DB returns null (empty / unseeded DB)', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.login({
        email: 'operator@cargopulse.com',
        password: 'Password123!',
      });

      expect(result.user.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(result.accessToken).toBe('signed-jwt-token-xyz');
    });
  });

  describe('getProfile', () => {
    it('should return profile from database when connected and found', async () => {
      prismaMock.isConnected = true;
      const dbProfile = {
        id: 'profile-uuid-1',
        email: 'user1@cargopulse.com',
        firstName: 'User',
        lastName: 'One',
        role: Role.FREIGHT_AUDITOR,
        isActive: true,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      };
      prismaMock.user.findUnique.mockResolvedValue(dbProfile);

      const profile = await service.getProfile('profile-uuid-1');

      expect(profile).toEqual(dbProfile);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-uuid-1' },
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
    });

    it('should fallback to DEMO_USERS by id when DB is offline', async () => {
      prismaMock.isConnected = false;

      const profile = await service.getProfile('33333333-3333-3333-3333-333333333333');

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(profile.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(profile.email).toBe('auditor@cargopulse.com');
      expect(profile.firstName).toBe('Elena');
      expect(profile.lastName).toBe('Rivas');
      expect(profile.role).toBe(Role.FREIGHT_AUDITOR);
    });

    it('should fallback to DEMO_USERS by id when DB query throws error', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB unreachable'));

      const profile = await service.getProfile('11111111-1111-1111-1111-111111111111');

      expect(profile.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(profile.email).toBe('admin@cargopulse.com');
      expect(profile.role).toBe(Role.ADMIN);
    });

    it('should throw NotFoundException when user id not found in DB or DEMO_USERS', async () => {
      prismaMock.isConnected = false;

      await expect(service.getProfile('unknown-id')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('register', () => {
    it('should throw ConflictException when DB is offline', async () => {
      prismaMock.isConnected = false;

      await expect(
        service.register({
          email: 'newuser@cargopulse.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when email is already registered in DB', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'existing@cargopulse.com',
          password: 'Password123!',
          firstName: 'Existing',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user and return AuthResponseDto when DB is online', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'new-user-id',
        email: 'new@cargopulse.com',
        firstName: 'New',
        lastName: 'Person',
        role: Role.LOGISTICS_OPERATOR,
        isActive: true,
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'new@cargopulse.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Person',
      });

      expect(result.user).toEqual(createdUser);
      expect(result.accessToken).toBe('signed-jwt-token-xyz');
    });
  });
});
