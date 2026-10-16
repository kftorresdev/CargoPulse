import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { AlertCenterController } from './alert-center.controller.js';
import { AlertCenterService } from './alert-center.service.js';

describe('AlertCenterController', () => {
  let controller: AlertCenterController;
  let serviceMock: {
    getKpis: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    createAlert: ReturnType<typeof vi.fn>;
    resolveAlert: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      getKpis: vi.fn(),
      findAll: vi.fn(),
      createAlert: vi.fn(),
      resolveAlert: vi.fn(),
    };
    controller = new AlertCenterController(
      serviceMock as unknown as AlertCenterService,
    );
  });

  it('should return KPIs from getKpis()', async () => {
    const mockKpis = {
      totalAlerts: 10,
      criticalCount: 2,
      highCount: 3,
      mediumCount: 3,
      lowCount: 2,
      openCount: 4,
      resolvedCount: 6,
      totalFinancialImpactUsd: 3200,
      slaBreachedCount: 1,
    };
    serviceMock.getKpis.mockResolvedValue(mockKpis);

    const result = await controller.getKpis();
    expect(result).toEqual(mockKpis);
    expect(serviceMock.getKpis).toHaveBeenCalledOnce();
  });

  it('should return alerts list from findAll()', async () => {
    const mockList = [
      { id: 'al-1', title: 'Delay', shipmentTracking: 'CP-101' },
    ];
    serviceMock.findAll.mockResolvedValue(mockList);

    const query = { status: AlertStatus.OPEN };
    const result = await controller.findAll(query);
    expect(result).toEqual(mockList);
    expect(serviceMock.findAll).toHaveBeenCalledWith(query);
  });

  it('should call createAlert on POST /alerts', async () => {
    const mockCreated = {
      id: 'al-2',
      title: 'Exam',
      status: AlertStatus.OPEN,
    };
    serviceMock.createAlert.mockResolvedValue(mockCreated);

    const dto = {
      shipmentId: 'ship-1',
      title: 'Exam',
      description: 'Customs hold',
      severity: AlertSeverity.HIGH,
      slaDeadline: new Date().toISOString(),
      financialImpactUsd: 500,
    };

    const result = await controller.createAlert(dto);
    expect(result).toEqual(mockCreated);
    expect(serviceMock.createAlert).toHaveBeenCalledWith(dto);
  });

  it('should call resolveAlert on PATCH /alerts/:id/resolve', async () => {
    const mockResolved = {
      id: 'al-1',
      status: AlertStatus.RESOLVED,
      resolutionNotes: 'Properly resolved with carrier',
    };
    serviceMock.resolveAlert.mockResolvedValue(mockResolved);

    const dto = { resolutionNotes: 'Properly resolved with carrier' };
    const result = await controller.resolveAlert('al-1', dto);
    expect(result).toEqual(mockResolved);
    expect(serviceMock.resolveAlert).toHaveBeenCalledWith('al-1', dto);
  });
});
