import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { InspectionsService } from './inspections.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let prismaMock: {
    isConnected: boolean;
    shipment: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    alert: {
      create: ReturnType<typeof vi.fn>;
    };
    note: {
      create: ReturnType<typeof vi.fn>;
    };
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  const createSampleDto = (): CreateInspectionDto => ({
    id: 'insp-001',
    shipmentId: 'ship-123',
    containerCondition: 'GOOD',
    sealIntact: true,
    sealNumberDeclared: 'SEAL-001',
    sealNumberActual: 'SEAL-001',
    sealMismatch: false,
    damagesReported: false,
    photos: [
      {
        fileName: 'seal.jpg',
        contentType: 'image/jpeg',
        base64Content: 'base64data',
      },
    ],
    signatureBase64: 'data:image/png;base64,signaturedata',
    signerName: 'Carlos Mendoza',
    gpsCoordinates: '25.6866,-100.3161',
    inspectedAt: '2026-10-18T06:00:00.000Z',
  });

  beforeEach(() => {
    prismaMock = {
      isConnected: true,
      shipment: {
        findFirst: vi.fn(),
      },
      alert: {
        create: vi.fn(),
      },
      note: {
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    service = new InspectionsService(
      prismaMock as unknown as PrismaService,
    );
  });

  it('should process clean inspection: creates Note, does not create Alert, and returns SYNCED', async () => {
    prismaMock.shipment.findFirst.mockResolvedValue({
      id: 'uuid-ship-123',
      trackingNumber: 'CP-2026-X9810',
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-001' });
    prismaMock.note.create.mockResolvedValue({ id: 'note-001' });

    const result = await service.createInspection(createSampleDto(), { id: 'user-001' });

    expect(result.id).toBe('insp-001');
    expect(result.shipmentId).toBe('ship-123');
    expect(result.status).toBe('SYNCED');
    expect(result.syncedAt).toBeInstanceOf(Date);
    expect(result.alertCreated).toBe(false);

    expect(prismaMock.alert.create).not.toHaveBeenCalled();
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'uuid-ship-123',
        authorId: 'user-001',
        content: expect.stringContaining('Carlos Mendoza'),
      }),
    });
  });

  it('should create Alert and Note when sealMismatch is true', async () => {
    prismaMock.shipment.findFirst.mockResolvedValue({
      id: 'uuid-ship-123',
      trackingNumber: 'CP-2026-X9810',
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-001' });
    prismaMock.alert.create.mockResolvedValue({ id: 'alert-001' });
    prismaMock.note.create.mockResolvedValue({ id: 'note-001' });

    const dtoWithMismatch = Object.assign(createSampleDto(), {
      sealMismatch: true,
      sealNumberActual: 'SEAL-TAMPERED-99',
    });

    const result = await service.createInspection(dtoWithMismatch, { id: 'user-001' });

    expect(result.status).toBe('SYNCED');
    expect(result.alertCreated).toBe(true);

    expect(prismaMock.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'uuid-ship-123',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        title: expect.stringContaining('Seal Mismatch'),
      }),
    });
    expect(prismaMock.note.create).toHaveBeenCalled();
  });

  it('should create Alert and Note when damagesReported is true', async () => {
    prismaMock.shipment.findFirst.mockResolvedValue({
      id: 'uuid-ship-123',
      trackingNumber: 'CP-2026-X9810',
    });
    prismaMock.user.findFirst.mockResolvedValue({ id: 'fallback-user' });
    prismaMock.alert.create.mockResolvedValue({ id: 'alert-002' });
    prismaMock.note.create.mockResolvedValue({ id: 'note-002' });

    const dtoWithDamage = Object.assign(createSampleDto(), {
      damagesReported: true,
      containerCondition: 'DAMAGED',
      damagesDescription: 'Punctured roof panel on trailer',
    });

    const result = await service.createInspection(dtoWithDamage);

    expect(result.status).toBe('SYNCED');
    expect(result.alertCreated).toBe(true);

    expect(prismaMock.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'uuid-ship-123',
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.OPEN,
        title: expect.stringContaining('Container Issue'),
      }),
    });
    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: 'fallback-user',
        content: expect.stringContaining('Punctured roof panel'),
      }),
    });
  });

  it('should create Critical Alert when both sealMismatch and damagesReported are true', async () => {
    prismaMock.shipment.findFirst.mockResolvedValue({
      id: 'uuid-ship-123',
      trackingNumber: 'CP-2026-X9810',
    });
    prismaMock.user.findFirst.mockResolvedValue({ id: 'fallback-user' });
    prismaMock.alert.create.mockResolvedValue({ id: 'alert-003' });
    prismaMock.note.create.mockResolvedValue({ id: 'note-003' });

    const dtoCritical = Object.assign(createSampleDto(), {
      sealMismatch: true,
      damagesReported: true,
      containerCondition: 'DAMAGED',
      damagesDescription: 'Broken seal and damaged door latch',
    });

    const result = await service.createInspection(dtoCritical);

    expect(result.status).toBe('SYNCED');
    expect(result.alertCreated).toBe(true);

    expect(prismaMock.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'uuid-ship-123',
        severity: AlertSeverity.CRITICAL,
        financialImpactUsd: 2500,
      }),
    });
  });

  it('should handle database errors gracefully without throwing', async () => {
    prismaMock.shipment.findFirst.mockRejectedValue(new Error('DB connection drop'));

    const sample = createSampleDto();
    const result = await service.createInspection(sample);

    expect(result.status).toBe('SYNCED');
    expect(result.id).toBe(sample.id);
  });
});
