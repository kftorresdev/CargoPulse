import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('should initialize with isConnected as false', () => {
    expect(service.isConnected).toBe(false);
  });

  it('should set isConnected to true when $connect succeeds', async () => {
    vi.spyOn(service, '$connect').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(service.isConnected).toBe(true);
  });

  it('should set isConnected to false when $connect fails', async () => {
    vi.spyOn(service, '$connect').mockRejectedValue(new Error('Connection refused'));

    await service.onModuleInit();

    expect(service.isConnected).toBe(false);
  });

  it('should set isConnected to false and call $disconnect on destroy', async () => {
    service.isConnected = true;
    const disconnectSpy = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledOnce();
    expect(service.isConnected).toBe(false);
  });
});
