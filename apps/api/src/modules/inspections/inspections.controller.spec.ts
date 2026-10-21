import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InspectionsController } from './inspections.controller.js';
import { InspectionsService } from './inspections.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';

describe('InspectionsController', () => {
  let controller: InspectionsController;
  let serviceMock: {
    createInspection: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      createInspection: vi.fn(),
    };
    controller = new InspectionsController(
      serviceMock as unknown as InspectionsService,
    );
  });

  it('should call service.createInspection with dto and authenticated user', async () => {
    const dto: CreateInspectionDto = {
      id: 'insp-101',
      shipmentId: 'ship-001',
      containerCondition: 'GOOD',
      sealIntact: true,
      sealNumberDeclared: 'SEAL-1',
      sealNumberActual: 'SEAL-1',
      sealMismatch: false,
      damagesReported: false,
      photos: [],
      signatureBase64: 'data:image/png;base64,sig',
      signerName: 'John Doe',
    };

    const user = { id: 'user-1', email: 'john@cargopulse.com' };
    const expectedResponse = {
      id: 'insp-101',
      shipmentId: 'ship-001',
      status: 'SYNCED',
      syncedAt: new Date(),
      alertCreated: false,
    };

    serviceMock.createInspection.mockResolvedValue(expectedResponse);

    const result = await controller.createInspection(dto, user);

    expect(serviceMock.createInspection).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual(expectedResponse);
  });
});
