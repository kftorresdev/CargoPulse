import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { AlertCenterService } from './alert-center.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('AlertCenterService', () => {
  let service: AlertCenterService;
  let prismaMock: {
    alert: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    shipment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      alert: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      shipment: {
        findUnique: vi.fn(),
      },
    };
    service = new AlertCenterService(prismaMock as unknown as PrismaService);
  });

  describe('calculateSlaRemaining', () => {
    it('should return BREACHED if deadline is in the past', () => {
      const pastDeadline = new Date(Date.now() - 60 * 1000);
      expect(service.calculateSlaRemaining(pastDeadline)).toBe('BREACHED');
    });

    it('should return DD:HH:MM formatted string for future deadlines', () => {
      // 2 days, 3 hours, 15 minutes in the future
      const ms = (2 * 24 * 60 + 3 * 60 + 15) * 60 * 1000;
      const futureDeadline = new Date(Date.now() + ms);
      const remaining = service.calculateSlaRemaining(futureDeadline);
      // Pad check
      expect(remaining).toMatch(/^02:03:1[4-5]$/);
    });
  });

  describe('findAll', () => {
    it('should return alerts with shipment tracking, carrier, and dynamic SLA remaining status', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAlerts = [
        {
          id: 'alert-1',
          shipmentId: 'ship-1',
          title: 'Customs Hold',
          description: 'Exam requested',
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.OPEN,
          slaDeadline: futureDate,
          financialImpactUsd: 1450,
          resolutionNotes: null,
          resolvedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          shipment: {
            trackingNumber: 'CP-1001',
            carrierName: 'OceanBridge Global',
          },
        },
      ];

      prismaMock.alert.findMany.mockResolvedValue(mockAlerts);

      const results = await service.findAll({ status: AlertStatus.OPEN });

      expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
        where: { status: AlertStatus.OPEN },
        include: {
          shipment: {
            select: {
              trackingNumber: true,
              carrierName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].shipmentTracking).toBe('CP-1001');
      expect(results[0].carrier).toBe('OceanBridge Global');
      expect(results[0].slaRemaining).not.toBe('BREACHED');
      expect(results[0].slaRemaining).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getKpis', () => {
    it('should aggregate KPI counts, financial impact of open/in_progress, and breached SLA count', async () => {
      const now = Date.now();
      const mockAlerts = [
        {
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.OPEN,
          slaDeadline: new Date(now + 3600000), // future
          financialImpactUsd: 1000,
          resolvedAt: null,
        },
        {
          severity: AlertSeverity.HIGH,
          status: AlertStatus.IN_PROGRESS,
          slaDeadline: new Date(now - 3600000), // past -> breached!
          financialImpactUsd: 500,
          resolvedAt: null,
        },
        {
          severity: AlertSeverity.MEDIUM,
          status: AlertStatus.RESOLVED,
          slaDeadline: new Date(now - 7200000),
          financialImpactUsd: 250,
          resolvedAt: new Date(now - 3600000), // resolved after deadline -> breached!
        },
        {
          severity: AlertSeverity.LOW,
          status: AlertStatus.RESOLVED,
          slaDeadline: new Date(now - 3600000),
          financialImpactUsd: 100,
          resolvedAt: new Date(now - 7200000), // resolved before deadline -> not breached!
        },
      ];

      prismaMock.alert.findMany.mockResolvedValue(mockAlerts);

      const kpis = await service.getKpis();

      expect(kpis.totalAlerts).toBe(4);
      expect(kpis.criticalCount).toBe(1);
      expect(kpis.highCount).toBe(1);
      expect(kpis.mediumCount).toBe(1);
      expect(kpis.lowCount).toBe(1);
      expect(kpis.openCount).toBe(1);
      expect(kpis.resolvedCount).toBe(2);
      // sum of OPEN ($1000) + IN_PROGRESS ($500) = $1500
      expect(kpis.totalFinancialImpactUsd).toBe(1500);
      // IN_PROGRESS past deadline (1) + RESOLVED past deadline (1) = 2
      expect(kpis.slaBreachedCount).toBe(2);
    });
  });

  describe('createAlert', () => {
    it('should create an alert when shipment exists', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({
        id: 'ship-1',
        trackingNumber: 'CP-1001',
        carrierName: 'OceanBridge Global',
      });

      const deadline = new Date(Date.now() + 86400000).toISOString();
      const mockCreated = {
        id: 'alert-new',
        shipmentId: 'ship-1',
        title: 'Inspection Delay',
        description: 'Random hold',
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
        slaDeadline: new Date(deadline),
        financialImpactUsd: 800,
        resolutionNotes: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        shipment: {
          trackingNumber: 'CP-1001',
          carrierName: 'OceanBridge Global',
        },
      };

      prismaMock.alert.create.mockResolvedValue(mockCreated);

      const result = await service.createAlert({
        shipmentId: 'ship-1',
        title: 'Inspection Delay',
        description: 'Random hold',
        severity: AlertSeverity.HIGH,
        slaDeadline: deadline,
        financialImpactUsd: 800,
      });

      expect(prismaMock.shipment.findUnique).toHaveBeenCalledWith({
        where: { id: 'ship-1' },
        select: { id: true, trackingNumber: true, carrierName: true },
      });
      expect(prismaMock.alert.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('alert-new');
      expect(result.shipmentTracking).toBe('CP-1001');
      expect(result.carrier).toBe('OceanBridge Global');
    });

    it('should throw NotFoundException if shipment does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(
        service.createAlert({
          shipmentId: 'invalid-shipment',
          title: 'Alert',
          description: 'Desc',
          severity: AlertSeverity.LOW,
          slaDeadline: new Date().toISOString(),
          financialImpactUsd: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveAlert', () => {
    it('should update status to RESOLVED, set resolvedAt and resolutionNotes', async () => {
      prismaMock.alert.findUnique.mockResolvedValue({ id: 'alert-1' });

      const mockResolved = {
        id: 'alert-1',
        shipmentId: 'ship-1',
        title: 'Chassis Fee',
        description: 'Split fee',
        severity: AlertSeverity.LOW,
        status: AlertStatus.RESOLVED,
        slaDeadline: new Date(),
        financialImpactUsd: 120,
        resolutionNotes: 'Credit memo issued against invoice.',
        resolvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        shipment: {
          trackingNumber: 'CP-1001',
          carrierName: 'OceanBridge Global',
        },
      };

      prismaMock.alert.update.mockResolvedValue(mockResolved);

      const result = await service.resolveAlert('alert-1', {
        resolutionNotes: 'Credit memo issued against invoice.',
      });

      expect(prismaMock.alert.update).toHaveBeenCalledOnce();
      const updateData = prismaMock.alert.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(AlertStatus.RESOLVED);
      expect(updateData.resolvedAt).toBeInstanceOf(Date);
      expect(updateData.resolutionNotes).toBe(
        'Credit memo issued against invoice.',
      );
      expect(result.status).toBe(AlertStatus.RESOLVED);
    });

    it('should throw NotFoundException if alert does not exist', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveAlert('non-existent-alert', {
          resolutionNotes: 'Valid notes over 10 chars',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
