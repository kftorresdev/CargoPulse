import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { StageStatus, StageType } from '@prisma/client';
import type { Response } from 'express';
import { FreightAuditService } from './freight-audit.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('FreightAuditService', () => {
  let service: FreightAuditService;
  let prismaMock: {
    isConnected?: boolean;
    freightStage: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    shipment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      freightStage: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      shipment: {
        findUnique: vi.fn(),
      },
    };
    service = new FreightAuditService(prismaMock as unknown as PrismaService);
  });

  describe('getSummary', () => {
    it('should aggregate financial metrics and return breakdown by all 5 stage types', async () => {
      const mockStages = [
        {
          id: 'stage-1',
          stageType: StageType.ORIGIN_HANDLING,
          stageOrder: 1,
          contractedCost: 1000,
          actualCost: 1000,
          status: StageStatus.APPROVED,
        },
        {
          id: 'stage-2',
          stageType: StageType.TRANSIT_1,
          stageOrder: 2,
          contractedCost: 4000,
          actualCost: 4500,
          status: StageStatus.DISPUTED,
        },
        {
          id: 'stage-3',
          stageType: StageType.CUSTOMS_BORDER,
          stageOrder: 3,
          contractedCost: 800,
          actualCost: 800,
          status: StageStatus.APPROVED,
        },
      ];

      prismaMock.freightStage.findMany.mockResolvedValue(mockStages);

      const summary = await service.getSummary();

      expect(summary.totalContractedCost).toBe(5800);
      expect(summary.totalActualCost).toBe(6300);
      expect(summary.totalVariance).toBe(500);
      expect(summary.variancePercentage).toBe(8.62);
      expect(summary.disputedStagesCount).toBe(1);

      // Verify all 5 stage types exist in breakdown
      expect(summary.breakdown).toHaveLength(5);

      const transit1Breakdown = summary.breakdown.find(
        (b) => b.stageType === StageType.TRANSIT_1,
      );
      expect(transit1Breakdown).toBeDefined();
      expect(transit1Breakdown?.totalContractedCost).toBe(4000);
      expect(transit1Breakdown?.totalActualCost).toBe(4500);
      expect(transit1Breakdown?.totalVariance).toBe(500);
      expect(transit1Breakdown?.variancePercentage).toBe(12.5);
      expect(transit1Breakdown?.disputedStagesCount).toBe(1);
      expect(transit1Breakdown?.stageCount).toBe(1);

      const transit2Breakdown = summary.breakdown.find(
        (b) => b.stageType === StageType.TRANSIT_2,
      );
      expect(transit2Breakdown?.stageCount).toBe(0);
      expect(transit2Breakdown?.totalContractedCost).toBe(0);
    });
  });

  describe('getShipmentAudit', () => {
    it('should return all 5 stages ordered by stageOrder', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      const mockStages = [
        { id: 'st-1', stageOrder: 1, stageType: StageType.ORIGIN_HANDLING },
        { id: 'st-2', stageOrder: 2, stageType: StageType.TRANSIT_1 },
        { id: 'st-3', stageOrder: 3, stageType: StageType.CUSTOMS_BORDER },
        { id: 'st-4', stageOrder: 4, stageType: StageType.TRANSIT_2 },
        { id: 'st-5', stageOrder: 5, stageType: StageType.FINAL_DESTINATION },
      ];
      prismaMock.freightStage.findMany.mockResolvedValue(mockStages);

      const stages = await service.getShipmentAudit('ship-1');

      expect(prismaMock.shipment.findUnique).toHaveBeenCalledWith({
        where: { id: 'ship-1' },
      });
      expect(prismaMock.freightStage.findMany).toHaveBeenCalledWith({
        where: { shipmentId: 'ship-1' },
        orderBy: { stageOrder: 'asc' },
      });
      expect(stages).toHaveLength(5);
    });

    it('should throw NotFoundException if shipment does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(service.getShipmentAudit('invalid-ship-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStageAudit', () => {
    it('should automatically set status = DISPUTED when variancePercent > 5 and status not specified', async () => {
      prismaMock.freightStage.findUnique.mockResolvedValue({
        id: 'st-1',
        contractedCost: 1000,
        actualCost: 1000,
        variance: 0,
        variancePercent: 0,
        status: StageStatus.PENDING,
      });

      prismaMock.freightStage.update.mockImplementation(({ data }) => ({
        id: 'st-1',
        ...data,
      }));

      const result = await service.updateStageAudit('st-1', {
        actualCost: 1080, // +8% variance
      });

      expect(prismaMock.freightStage.update).toHaveBeenCalledOnce();
      const updateData = prismaMock.freightStage.update.mock.calls[0][0].data;
      expect(updateData.variance).toBe(80);
      expect(updateData.variancePercent).toBe(8);
      expect(updateData.status).toBe(StageStatus.DISPUTED);
      expect(result.status).toBe(StageStatus.DISPUTED);
    });

    it('should automatically set status = APPROVED when variancePercent <= 0 and status not specified', async () => {
      prismaMock.freightStage.findUnique.mockResolvedValue({
        id: 'st-2',
        contractedCost: 1000,
        actualCost: 1000,
        variance: 0,
        variancePercent: 0,
        status: StageStatus.PENDING,
      });

      prismaMock.freightStage.update.mockImplementation(({ data }) => ({
        id: 'st-2',
        ...data,
      }));

      const result = await service.updateStageAudit('st-2', {
        actualCost: 950, // -5% variance
      });

      const updateData = prismaMock.freightStage.update.mock.calls[0][0].data;
      expect(updateData.variance).toBe(-50);
      expect(updateData.variancePercent).toBe(-5);
      expect(updateData.status).toBe(StageStatus.APPROVED);
      expect(result.status).toBe(StageStatus.APPROVED);
    });

    it('should respect manual status override even if variance rule would differ', async () => {
      prismaMock.freightStage.findUnique.mockResolvedValue({
        id: 'st-3',
        contractedCost: 1000,
        status: StageStatus.PENDING,
      });

      prismaMock.freightStage.update.mockImplementation(({ data }) => ({
        id: 'st-3',
        ...data,
      }));

      const result = await service.updateStageAudit('st-3', {
        actualCost: 1200, // +20%
        status: StageStatus.APPROVED, // manually approved by auditor
        auditNotes: 'Special port surcharge approved by management.',
      });

      const updateData = prismaMock.freightStage.update.mock.calls[0][0].data;
      expect(updateData.status).toBe(StageStatus.APPROVED);
      expect(updateData.auditNotes).toBe(
        'Special port surcharge approved by management.',
      );
      expect(result.status).toBe(StageStatus.APPROVED);
    });

    it('should throw NotFoundException when freight stage is not found', async () => {
      prismaMock.freightStage.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStageAudit('non-existent', { actualCost: 500 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportToExcel', () => {
    it('should generate workbook and stream buffer with spreadsheet mime headers', async () => {
      prismaMock.freightStage.findMany.mockResolvedValue([
        {
          id: 'stage-1',
          stageType: StageType.ORIGIN_HANDLING,
          stageOrder: 1,
          contractedCost: 1200,
          actualCost: 1200,
          variance: 0,
          variancePercent: 0,
          status: StageStatus.APPROVED,
          auditNotes: 'Initial check',
          shipment: {
            trackingNumber: 'CP-1001',
            carrierName: 'OceanBridge Global',
          },
        },
        {
          id: 'stage-2',
          stageType: StageType.TRANSIT_1,
          stageOrder: 2,
          contractedCost: 4500,
          actualCost: 4900,
          variance: 400,
          variancePercent: 8.89,
          status: StageStatus.DISPUTED,
          auditNotes: 'Over billed fuel',
          shipment: {
            trackingNumber: 'CP-1001',
            carrierName: 'OceanBridge Global',
          },
        },
      ]);

      const headers: Record<string, string> = {};
      let responseEnded = false;
      let bufferSent: Buffer | null = null;

      const setHeaderSpy = vi.fn((key: string, val: string) => {
        headers[key] = val;
      });
      const endSpy = vi.fn((chunk?: Buffer) => {
        responseEnded = true;
        if (chunk) bufferSent = chunk;
      });

      const mockRes = {
        setHeader: setHeaderSpy,
        end: endSpy,
      } as unknown as Response;

      await service.exportToExcel(mockRes);

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=freight-audit-report.xlsx',
      );
      expect(responseEnded).toBe(true);
      expect(bufferSent).not.toBeNull();
      expect(Buffer.isBuffer(bufferSent)).toBe(true);
    });
  });

  describe('Dual-Mode In-Memory Resilience (Offline Fallback)', () => {
    beforeEach(() => {
      prismaMock.isConnected = false;
    });

    it('should compute financial summary from in-memory DEMO_STAGES when DB is offline', async () => {
      const summary = await service.getSummary();

      expect(summary.totalContractedCost).toBe(27000);
      expect(summary.totalActualCost).toBe(27770);
      expect(summary.totalVariance).toBe(770);
      expect(summary.variancePercentage).toBe(2.85);
      expect(summary.disputedStagesCount).toBe(2);
      expect(summary.breakdown).toHaveLength(5);
      expect(summary.stageBreakdown).toHaveLength(5);
      expect(prismaMock.freightStage.findMany).not.toHaveBeenCalled();
    });

    it('should return 5 stages matching shipmentId or trackingNumber in offline mode', async () => {
      const stages = await service.getShipmentAudit('CP-2026-X9810');

      expect(stages).toHaveLength(5);
      expect(stages[0].stageType).toBe(StageType.ORIGIN_HANDLING);
      expect(stages[1].status).toBe(StageStatus.DISPUTED);
      expect(prismaMock.shipment.findUnique).not.toHaveBeenCalled();
    });

    it('should update in-memory stage and auto-dispute when variance > 5% in offline mode', async () => {
      const result = await service.updateStageAudit('stage-x9810-1', {
        actualCost: 1350, // +12.5% variance from 1200
        auditNotes: 'Offline audit override noted',
      });

      expect(result.id).toBe('stage-x9810-1');
      expect(result.actualCost).toBe(1350);
      expect(result.variance).toBe(150);
      expect(result.variancePercent).toBe(12.5);
      expect(result.status).toBe(StageStatus.DISPUTED);
      expect(result.auditNotes).toBe('Offline audit override noted');
      expect(prismaMock.freightStage.update).not.toHaveBeenCalled();
    });

    it('should export formatted excel using DEMO_STAGES in offline mode', async () => {
      const headers: Record<string, string> = {};
      let responseEnded = false;
      let bufferSent: Buffer | null = null;

      const setHeaderSpy = vi.fn((key: string, val: string) => {
        headers[key] = val;
      });
      const endSpy = vi.fn((chunk?: Buffer) => {
        responseEnded = true;
        if (chunk) bufferSent = chunk;
      });

      const mockRes = {
        setHeader: setHeaderSpy,
        end: endSpy,
      } as unknown as Response;

      await service.exportToExcel(mockRes);

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=freight-audit-report.xlsx',
      );
      expect(responseEnded).toBe(true);
      expect(bufferSent).not.toBeNull();
      expect(Buffer.isBuffer(bufferSent)).toBe(true);
      expect(prismaMock.freightStage.findMany).not.toHaveBeenCalled();
    });

    it('should fallback to in-memory demo stages when database query throws error', async () => {
      prismaMock.isConnected = true;
      prismaMock.freightStage.findMany.mockRejectedValue(
        new Error('PostgreSQL socket closed unexpectedly'),
      );

      const summary = await service.getSummary();

      expect(summary).toBeDefined();
      expect(summary.totalContractedCost).toBe(27000);
      expect(summary.breakdown).toHaveLength(5);
    });
  });
});
