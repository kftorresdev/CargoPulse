import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Response } from 'express';
import { StageStatus, StageType } from '@prisma/client';
import { FreightAuditController } from './freight-audit.controller.js';
import { FreightAuditService } from './freight-audit.service.js';

describe('FreightAuditController', () => {
  let controller: FreightAuditController;
  let serviceMock: {
    getSummary: ReturnType<typeof vi.fn>;
    getShipmentAudit: ReturnType<typeof vi.fn>;
    updateStageAudit: ReturnType<typeof vi.fn>;
    exportToExcel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      getSummary: vi.fn(),
      getShipmentAudit: vi.fn(),
      updateStageAudit: vi.fn(),
      exportToExcel: vi.fn(),
    };
    controller = new FreightAuditController(
      serviceMock as unknown as FreightAuditService,
    );
  });

  it('should return summary from getSummary()', async () => {
    const mockSummary = {
      totalContractedCost: 10000,
      totalActualCost: 10500,
      totalVariance: 500,
      variancePercentage: 5.0,
      disputedStagesCount: 1,
      breakdown: [],
    };
    serviceMock.getSummary.mockResolvedValue(mockSummary);

    const result = await controller.getSummary();
    expect(result).toEqual(mockSummary);
    expect(serviceMock.getSummary).toHaveBeenCalledOnce();
  });

  it('should return stages from getShipmentAudit()', async () => {
    const mockStages = [
      { id: 'stage-1', stageType: StageType.ORIGIN_HANDLING, stageOrder: 1 },
    ];
    serviceMock.getShipmentAudit.mockResolvedValue(mockStages);

    const result = await controller.getShipmentAudit('ship-123');
    expect(result).toEqual(mockStages);
    expect(serviceMock.getShipmentAudit).toHaveBeenCalledWith('ship-123');
  });

  it('should call updateStageAudit with parameters', async () => {
    const mockUpdated = {
      id: 'stage-1',
      actualCost: 1250,
      status: StageStatus.APPROVED,
    };
    serviceMock.updateStageAudit.mockResolvedValue(mockUpdated);

    const dto = { actualCost: 1250, status: StageStatus.APPROVED };
    const result = await controller.updateStageAudit('stage-1', dto);
    expect(result).toEqual(mockUpdated);
    expect(serviceMock.updateStageAudit).toHaveBeenCalledWith('stage-1', dto);
  });

  it('should delegate Excel export to service', async () => {
    const mockRes = {} as Response;
    await controller.exportToExcel(mockRes, 'es');
    expect(serviceMock.exportToExcel).toHaveBeenCalledWith(mockRes, 'es');
  });
});
