import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipmentStatus } from '@prisma/client';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsService } from './shipments.service.js';

describe('ShipmentsController', () => {
  let controller: ShipmentsController;
  let serviceMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      updateStatus: vi.fn(),
    };
    controller = new ShipmentsController(
      serviceMock as unknown as ShipmentsService,
    );
  });

  it('should call service.create with dto and userId', async () => {
    const dto = {
      origin: 'A',
      destination: 'B',
      carrierName: 'C',
      eta: '2026-10-25T12:00:00.000Z',
    };
    serviceMock.create.mockResolvedValue({ id: 'ship-1' });

    const res = await controller.create(dto, 'user-123');
    expect(serviceMock.create).toHaveBeenCalledWith(dto, 'user-123');
    expect(res).toEqual({ id: 'ship-1' });
  });

  it('should call service.findAll with query', async () => {
    const query = { page: 1, limit: 10 };
    serviceMock.findAll.mockResolvedValue({ items: [], meta: {} });

    const res = await controller.findAll(query);
    expect(serviceMock.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual({ items: [], meta: {} });
  });

  it('should call service.findOne with id', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'ship-1' });

    const res = await controller.findOne('ship-1');
    expect(serviceMock.findOne).toHaveBeenCalledWith('ship-1');
    expect(res).toEqual({ id: 'ship-1' });
  });

  it('should call service.updateStatus with id and dto', async () => {
    const dto = { currentStatus: ShipmentStatus.DELIVERED };
    serviceMock.updateStatus.mockResolvedValue({ id: 'ship-1', currentStatus: ShipmentStatus.DELIVERED });

    const res = await controller.updateStatus('ship-1', dto);
    expect(serviceMock.updateStatus).toHaveBeenCalledWith('ship-1', dto);
    expect(res).toEqual({ id: 'ship-1', currentStatus: ShipmentStatus.DELIVERED });
  });
});
