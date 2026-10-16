import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ShipmentStatus, StageStatus, StageType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateShipmentDto,
  ShipmentQueryDto,
  UpdateShipmentStatusDto,
} from './dto/index.js';

export type ShipmentListItem = Prisma.ShipmentGetPayload<{
  include: {
    stages: true;
    _count: {
      select: {
        alerts: true;
      };
    };
  };
}> & {
  alertsCount: number;
};

export interface PaginatedShipmentsResponse {
  items: ShipmentListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type ShipmentDetail = Prisma.ShipmentGetPayload<{
  include: {
    stages: true;
    alerts: true;
    notes: {
      include: {
        author: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            email: true;
            role: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new shipment with 5 default freight stages if not provided.
   */
  async create(dto: CreateShipmentDto, _userId?: string) {
    const trackingNumber =
      dto.trackingNumber?.trim() || `CP-${Date.now().toString().slice(-6)}`;

    const defaultStageTypes: StageType[] = [
      StageType.ORIGIN_HANDLING,
      StageType.TRANSIT_1,
      StageType.CUSTOMS_BORDER,
      StageType.TRANSIT_2,
      StageType.FINAL_DESTINATION,
    ];

    const stagesCreateData: Prisma.FreightStageCreateWithoutShipmentInput[] =
      dto.stages && dto.stages.length > 0
        ? dto.stages.map((stage, idx) => {
            const contractedCost = Number(stage.contractedCost ?? 0);
            const actualCost = Number(stage.actualCost ?? contractedCost);
            const variance = Number((actualCost - contractedCost).toFixed(2));
            const variancePercent =
              contractedCost > 0
                ? Number(((variance / contractedCost) * 100).toFixed(2))
                : 0.0;

            return {
              stageType: stage.stageType,
              stageOrder: stage.stageOrder ?? idx + 1,
              contractedCost,
              actualCost,
              variance,
              variancePercent,
              currency: stage.currency || 'USD',
              status: stage.status || StageStatus.PENDING,
              auditNotes: stage.auditNotes || null,
            };
          })
        : defaultStageTypes.map((type, idx) => ({
            stageType: type,
            stageOrder: idx + 1,
            contractedCost: 0.0,
            actualCost: 0.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: null,
          }));

    return this.prisma.shipment.create({
      data: {
        trackingNumber,
        origin: dto.origin,
        destination: dto.destination,
        carrierName: dto.carrierName,
        eta: new Date(dto.eta),
        stages: {
          create: stagesCreateData,
        },
      },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        _count: {
          select: {
            alerts: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Paginated shipment search and filtering with stages and alerts count.
   */
  async findAll(query: ShipmentQueryDto): Promise<PaginatedShipmentsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {};

    if (query.status) {
      where.currentStatus = query.status;
    }

    if (query.origin) {
      where.origin = { contains: query.origin, mode: 'insensitive' };
    }

    if (query.destination) {
      where.destination = { contains: query.destination, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { trackingNumber: { contains: query.search, mode: 'insensitive' } },
        { origin: { contains: query.search, mode: 'insensitive' } },
        { destination: { contains: query.search, mode: 'insensitive' } },
        { carrierName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stages: {
            orderBy: { stageOrder: 'asc' },
          },
          _count: {
            select: {
              alerts: true,
            },
          },
        },
      }),
    ]);

    const items: ShipmentListItem[] = shipments.map((shipment) => ({
      ...shipment,
      alertsCount: shipment._count.alerts,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Finds one shipment with full stages, alerts, and notes.
   */
  async findOne(id: string): Promise<ShipmentDetail> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${id}" not found`);
    }

    return shipment;
  }

  /**
   * Updates shipment status and sets actualDelivery if DELIVERED.
   */
  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    const existing = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Shipment with ID "${id}" not found`);
    }

    const updateData: Prisma.ShipmentUpdateInput = {
      currentStatus: dto.currentStatus,
    };

    if (dto.currentStatus === ShipmentStatus.DELIVERED) {
      updateData.actualDelivery = new Date();
    }

    return this.prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        _count: {
          select: {
            alerts: true,
          },
        },
      },
    });
  }
}
