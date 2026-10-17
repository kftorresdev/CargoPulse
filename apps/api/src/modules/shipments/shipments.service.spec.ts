import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ShipmentStatus, StageType } from '@prisma/client';
import { ShipmentsService } from './shipments.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let prismaMock: {
    isConnected?: boolean;
    shipment: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      shipment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };
    service = new ShipmentsService(prismaMock as unknown as PrismaService);
  });

  describe('create', () => {
    it('should create a shipment with 5 default freight stages when stages are not provided', async () => {
      const mockCreated = {
        id: 'ship-1',
        trackingNumber: 'CP-123456',
        origin: 'Shanghai Port, CN',
        destination: 'Los Angeles Gateway, US',
        carrierName: 'OceanBridge Global',
        eta: new Date('2026-10-25T12:00:00.000Z'),
        stages: [
          { stageType: StageType.ORIGIN_HANDLING, stageOrder: 1 },
          { stageType: StageType.TRANSIT_1, stageOrder: 2 },
          { stageType: StageType.CUSTOMS_BORDER, stageOrder: 3 },
          { stageType: StageType.TRANSIT_2, stageOrder: 4 },
          { stageType: StageType.FINAL_DESTINATION, stageOrder: 5 },
        ],
        _count: { alerts: 0, notes: 0 },
      };

      prismaMock.shipment.create.mockResolvedValue(mockCreated);

      const result = await service.create({
        origin: 'Shanghai Port, CN',
        destination: 'Los Angeles Gateway, US',
        carrierName: 'OceanBridge Global',
        eta: '2026-10-25T12:00:00.000Z',
      });

      expect(prismaMock.shipment.create).toHaveBeenCalledOnce();
      const callArg = prismaMock.shipment.create.mock.calls[0][0];
      expect(callArg.data.trackingNumber).toMatch(/^CP-/);
      expect(callArg.data.stages.create).toHaveLength(5);
      expect(callArg.data.stages.create[0].stageType).toBe(StageType.ORIGIN_HANDLING);
      expect(callArg.data.stages.create[4].stageType).toBe(StageType.FINAL_DESTINATION);
      expect(result).toEqual(mockCreated);
    });

    it('should create a shipment with custom stages and calculate cost variance', async () => {
      prismaMock.shipment.create.mockResolvedValue({ id: 'ship-2' });

      await service.create({
        trackingNumber: 'CP-CUSTOM-001',
        origin: 'Tokyo',
        destination: 'Seattle',
        carrierName: 'Pacific Express',
        eta: '2026-11-01T00:00:00.000Z',
        stages: [
          {
            stageType: StageType.ORIGIN_HANDLING,
            contractedCost: 1000,
            actualCost: 1200,
          },
        ],
      });

      const callArg = prismaMock.shipment.create.mock.calls[0][0];
      expect(callArg.data.trackingNumber).toBe('CP-CUSTOM-001');
      expect(callArg.data.stages.create[0].contractedCost).toBe(1000);
      expect(callArg.data.stages.create[0].actualCost).toBe(1200);
      expect(callArg.data.stages.create[0].variance).toBe(200);
      expect(callArg.data.stages.create[0].variancePercent).toBe(20);
    });
  });

  describe('findAll', () => {
    it('should return paginated shipments with meta and alertsCount', async () => {
      const mockShipments = [
        {
          id: 'ship-1',
          trackingNumber: 'CP-001',
          stages: [],
          _count: { alerts: 3 },
        },
      ];

      prismaMock.shipment.count.mockResolvedValue(1);
      prismaMock.shipment.findMany.mockResolvedValue(mockShipments);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].alertsCount).toBe(3);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should build search and filter query where conditions', async () => {
      prismaMock.shipment.count.mockResolvedValue(0);
      prismaMock.shipment.findMany.mockResolvedValue([]);

      await service.findAll({
        status: ShipmentStatus.IN_TRANSIT_ORIGIN,
        origin: 'Shanghai',
        destination: 'Rotterdam',
        search: 'Ocean',
      });

      const countCall = prismaMock.shipment.count.mock.calls[0][0];
      expect(countCall.where.currentStatus).toBe(ShipmentStatus.IN_TRANSIT_ORIGIN);
      expect(countCall.where.origin).toEqual({ contains: 'Shanghai', mode: 'insensitive' });
      expect(countCall.where.destination).toEqual({ contains: 'Rotterdam', mode: 'insensitive' });
      expect(countCall.where.OR).toHaveLength(4);
    });
  });

  describe('findOne', () => {
    it('should return shipment detail with relations', async () => {
      const mockShipment = {
        id: 'ship-1',
        stages: [],
        alerts: [],
        notes: [],
      };
      prismaMock.shipment.findUnique.mockResolvedValue(mockShipment);

      const result = await service.findOne('ship-1');
      expect(result).toEqual(mockShipment);
    });

    it('should throw NotFoundException if shipment not found', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status and set actualDelivery when DELIVERED', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.shipment.update.mockResolvedValue({
        id: 'ship-1',
        currentStatus: ShipmentStatus.DELIVERED,
      });

      await service.updateStatus('ship-1', {
        currentStatus: ShipmentStatus.DELIVERED,
      });

      const updateCall = prismaMock.shipment.update.mock.calls[0][0];
      expect(updateCall.data.currentStatus).toBe(ShipmentStatus.DELIVERED);
      expect(updateCall.data.actualDelivery).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if shipment does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', {
          currentStatus: ShipmentStatus.IN_TRANSIT_ORIGIN,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Dual-Mode In-Memory Resilience (Offline Fallback)', () => {
    beforeEach(() => {
      prismaMock.isConnected = false;
    });

    it('should return paginated shipments with 6 pre-seeded shipments when DB is offline', async () => {
      const result = await service.findAll({});

      expect(result.items).toHaveLength(6);
      expect(result.meta.total).toBe(6);
      expect(result.meta.totalPages).toBe(1);

      const trackingNumbers = result.items.map((i) => i.trackingNumber);
      expect(trackingNumbers).toContain('CP-2026-X9810');
      expect(trackingNumbers).toContain('CP-2026-E4421');
      expect(trackingNumbers).toContain('CP-2026-A1092');
      expect(trackingNumbers).toContain('CP-MXUS-2026-001');
      expect(trackingNumbers).toContain('CP-MXUS-2026-002');
      expect(trackingNumbers).toContain('CP-MXUS-2026-003');

      expect(prismaMock.shipment.findMany).not.toHaveBeenCalled();
    });

    it('should filter in-memory shipments by status, search, and origin', async () => {
      const customsHold = await service.findAll({
        status: ShipmentStatus.CUSTOMS_HOLD,
      });
      expect(customsHold.items).toHaveLength(2);
      expect(
        customsHold.items.every(
          (s) => s.currentStatus === ShipmentStatus.CUSTOMS_HOLD,
        ),
      ).toBe(true);

      const monterrey = await service.findAll({
        search: 'Monterrey',
      });
      expect(monterrey.items).toHaveLength(2);

      const shanghai = await service.findAll({
        origin: 'Shanghai',
      });
      expect(shanghai.items).toHaveLength(1);
      expect(shanghai.items[0].trackingNumber).toBe('CP-2026-X9810');
    });

    it('should find single shipment by id or trackingNumber in offline mode', async () => {
      const byTracking = await service.findOne('CP-2026-X9810');
      expect(byTracking.trackingNumber).toBe('CP-2026-X9810');
      expect(byTracking.carrierName).toBe('OceanBridge Global');
      expect(byTracking.stages).toHaveLength(5);

      const byId = await service.findOne('shipment-x9810');
      expect(byId.trackingNumber).toBe('CP-2026-X9810');

      expect(prismaMock.shipment.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent shipment in offline mode', async () => {
      await expect(service.findOne('invalid-unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a shipment in-memory with default 5 stages in offline mode', async () => {
      const created = await service.create({
        origin: 'Tokyo, JP',
        destination: 'Vancouver, CA',
        carrierName: 'ONE Line',
        eta: '2026-11-05T00:00:00.000Z',
      });

      expect(created.id).toMatch(/^shipment-/);
      expect(created.trackingNumber).toMatch(/^CP-/);
      expect(created.stages).toHaveLength(5);
      expect(created.currentStatus).toBe(ShipmentStatus.DRAFT);

      expect(prismaMock.shipment.create).not.toHaveBeenCalled();
    });

    it('should update status and actualDelivery in offline mode', async () => {
      const updated = await service.updateStatus('CP-2026-X9810', {
        currentStatus: ShipmentStatus.DELIVERED,
      });

      expect(updated.currentStatus).toBe(ShipmentStatus.DELIVERED);
      expect(updated.actualDelivery).toBeInstanceOf(Date);

      expect(prismaMock.shipment.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent shipment in offline mode', async () => {
      await expect(
        service.updateStatus('non-existent-shipment', {
          currentStatus: ShipmentStatus.DELIVERED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fallback to in-memory demo shipments when DB throws error', async () => {
      prismaMock.isConnected = true;
      prismaMock.shipment.count.mockRejectedValue(
        new Error('PostgreSQL socket disconnected'),
      );

      const result = await service.findAll({});

      expect(result.items.length).toBeGreaterThanOrEqual(6);
      expect(result.items[0].trackingNumber).toBeDefined();
    });
  });
});
