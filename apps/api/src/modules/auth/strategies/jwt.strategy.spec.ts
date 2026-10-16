import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { JwtStrategy, JwtPayload } from './jwt.strategy.js';
import { PrismaService } from '../../../database/prisma.service.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaMock: {
    isConnected: boolean;
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let configServiceMock: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      isConnected: false,
      user: {
        findUnique: vi.fn(),
      },
    };

    configServiceMock = {
      get: vi.fn().mockReturnValue('test-secret'),
    };

    strategy = new JwtStrategy(
      configServiceMock as unknown as ConfigService,
      prismaMock as unknown as PrismaService,
    );
  });

  describe('validate - Online Database Mode (isConnected = true)', () => {
    it('should return user from database when connected and user exists and is active', async () => {
      prismaMock.isConnected = true;
      const dbUser = {
        id: 'real-db-user-id',
        email: 'real@cargopulse.com',
        firstName: 'Real',
        lastName: 'User',
        role: Role.LOGISTICS_OPERATOR,
        isActive: true,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      };
      prismaMock.user.findUnique.mockResolvedValue(dbUser);

      const payload: JwtPayload = {
        sub: 'real-db-user-id',
        email: 'real@cargopulse.com',
        role: Role.LOGISTICS_OPERATOR,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual(dbUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'real-db-user-id' },
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

    it('should throw UnauthorizedException when db user is deactivated', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'deactivated-id',
        email: 'inactive@cargopulse.com',
        firstName: 'Deactivated',
        lastName: 'User',
        role: Role.FREIGHT_AUDITOR,
        isActive: false,
        createdAt: new Date(),
      });

      const payload: JwtPayload = {
        sub: 'deactivated-id',
        email: 'inactive@cargopulse.com',
        role: Role.FREIGHT_AUDITOR,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User is not authorized or account is inactive'),
      );
    });

    it('should fallback to DEMO_USERS when DB query throws error', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockRejectedValue(new Error('PostgreSQL socket error'));

      const payload: JwtPayload = {
        sub: '11111111-1111-1111-1111-111111111111',
        email: 'admin@cargopulse.com',
        role: Role.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.email).toBe('admin@cargopulse.com');
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should fallback to DEMO_USERS when DB returns null', async () => {
      prismaMock.isConnected = true;
      prismaMock.user.findUnique.mockResolvedValue(null);

      const payload: JwtPayload = {
        sub: '22222222-2222-2222-2222-222222222222',
        email: 'operator@cargopulse.com',
        role: Role.LOGISTICS_OPERATOR,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(result.role).toBe(Role.LOGISTICS_OPERATOR);
    });
  });

  describe('validate - Offline Fallback Mode (!isConnected)', () => {
    it('should authenticate demo auditor by payload.sub without querying database', async () => {
      prismaMock.isConnected = false;

      const payload: JwtPayload = {
        sub: '33333333-3333-3333-3333-333333333333',
        email: 'auditor@cargopulse.com',
        role: Role.FREIGHT_AUDITOR,
      };

      const result = await strategy.validate(payload);

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(result.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(result.email).toBe('auditor@cargopulse.com');
      expect(result.firstName).toBe('Elena');
      expect(result.lastName).toBe('Rivas');
      expect(result.role).toBe(Role.FREIGHT_AUDITOR);
      expect(result.isActive).toBe(true);
    });

    it('should throw UnauthorizedException when payload.sub is not found in DEMO_USERS', async () => {
      prismaMock.isConnected = false;

      const payload: JwtPayload = {
        sub: '99999999-9999-9999-9999-999999999999',
        email: 'notfound@cargopulse.com',
        role: Role.LOGISTICS_OPERATOR,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User is not authorized or account is inactive'),
      );
    });
  });
});
