import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AlertSeverity,
  AlertStatus,
  Prisma,
  ShipmentStatus,
  StageStatus,
  StageType,
} from '@prisma/client';
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
  private readonly logger = new Logger(ShipmentsService.name);
  private demoShipments: ShipmentDetail[] = this.createInitialDemoShipments();

  constructor(private readonly prisma: PrismaService) {}

  private get isDbAvailable(): boolean {
    return this.prisma?.isConnected !== false;
  }

  private createDefaultStagesForShipment(
    shipmentId: string,
    costs: [number, number, number, number, number],
  ): any[] {
    const stageTypes: StageType[] = [
      StageType.ORIGIN_HANDLING,
      StageType.TRANSIT_1,
      StageType.CUSTOMS_BORDER,
      StageType.TRANSIT_2,
      StageType.FINAL_DESTINATION,
    ];
    const now = new Date();
    return stageTypes.map((type, idx) => ({
      id: `stage-${shipmentId}-${idx + 1}`,
      shipmentId,
      stageType: type,
      stageOrder: idx + 1,
      contractedCost: costs[idx],
      actualCost: costs[idx],
      variance: 0.0,
      variancePercent: 0.0,
      currency: 'USD',
      status: StageStatus.APPROVED,
      auditNotes: null,
      createdAt: now,
      updatedAt: now,
    }));
  }

  private createInitialDemoShipments(): ShipmentDetail[] {
    const now = Date.now();
    return [
      {
        id: 'shipment-x9810',
        trackingNumber: 'CP-2026-X9810',
        origin: 'Shanghai Port, CN',
        destination: 'Los Angeles Gateway, US',
        currentStatus: ShipmentStatus.CUSTOMS_HOLD,
        carrierName: 'OceanBridge Global',
        eta: new Date(now + 5 * 24 * 3600 * 1000),
        actualDelivery: null,
        stages: [
          {
            id: 'stage-x9810-1',
            shipmentId: 'shipment-x9810',
            stageType: StageType.ORIGIN_HANDLING,
            stageOrder: 1,
            contractedCost: 1200.0,
            actualCost: 1200.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Export documentation and container drayage verified.',
            createdAt: new Date(now - 7 * 24 * 3600 * 1000),
            updatedAt: new Date(now - 7 * 24 * 3600 * 1000),
          },
          {
            id: 'stage-x9810-2',
            shipmentId: 'shipment-x9810',
            stageType: StageType.TRANSIT_1,
            stageOrder: 2,
            contractedCost: 4500.0,
            actualCost: 4850.0,
            variance: 350.0,
            variancePercent: 7.78,
            currency: 'USD',
            status: StageStatus.DISPUTED,
            auditNotes:
              'Bunker adjustment factor surcharge disputed with ocean carrier.',
            createdAt: new Date(now - 6 * 24 * 3600 * 1000),
            updatedAt: new Date(now - 6 * 24 * 3600 * 1000),
          },
          {
            id: 'stage-x9810-3',
            shipmentId: 'shipment-x9810',
            stageType: StageType.CUSTOMS_BORDER,
            stageOrder: 3,
            contractedCost: 850.0,
            actualCost: 1250.0,
            variance: 400.0,
            variancePercent: 47.06,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes:
              'Intensive exam fee applied due to random CBP inspection.',
            createdAt: new Date(now - 5 * 24 * 3600 * 1000),
            updatedAt: new Date(now - 5 * 24 * 3600 * 1000),
          },
          {
            id: 'stage-x9810-4',
            shipmentId: 'shipment-x9810',
            stageType: StageType.TRANSIT_2,
            stageOrder: 4,
            contractedCost: 1600.0,
            actualCost: 1600.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Rail intermodal booking confirmed.',
            createdAt: new Date(now - 4 * 24 * 3600 * 1000),
            updatedAt: new Date(now - 4 * 24 * 3600 * 1000),
          },
          {
            id: 'stage-x9810-5',
            shipmentId: 'shipment-x9810',
            stageType: StageType.FINAL_DESTINATION,
            stageOrder: 5,
            contractedCost: 750.0,
            actualCost: 750.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Final warehouse delivery scheduled.',
            createdAt: new Date(now - 3 * 24 * 3600 * 1000),
            updatedAt: new Date(now - 3 * 24 * 3600 * 1000),
          },
        ],
        alerts: [
          {
            id: 'alert-1',
            shipmentId: 'shipment-x9810',
            title:
              'Vessel Berth Delay Exceeding 18 Hours (MAERSK MC-KINNEY)',
            description:
              '340 Refrigerated Pharma Containers at risk of cold-chain deviation.',
            severity: AlertSeverity.CRITICAL,
            status: AlertStatus.OPEN,
            slaDeadline: new Date(now + 2 * 3600 * 1000),
            financialImpactUsd: 45000,
            resolutionNotes: null,
            resolvedAt: null,
            createdAt: new Date(now - 3600 * 1000),
            updatedAt: new Date(now - 3600 * 1000),
          },
        ] as any,
        notes: [
          {
            id: 'note-1',
            shipmentId: 'shipment-x9810',
            authorId: 'user-admin',
            author: {
              id: 'user-admin',
              firstName: 'Kevin',
              lastName: 'Torres',
              email: 'admin@cargopulse.com',
              role: 'ADMIN',
            },
            parentId: null,
            content:
              'Master B/L released by ocean carrier. Temperature logs required for refrigerated container.',
            attachmentUrl: null,
            createdAt: new Date(now - 4 * 3600 * 1000),
            updatedAt: new Date(now - 4 * 3600 * 1000),
          },
        ] as any,
        createdAt: new Date(now - 10 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        id: 'shipment-e4421',
        trackingNumber: 'CP-2026-E4421',
        origin: 'Rotterdam Europort, NL',
        destination: 'Chicago Logistics Hub, US',
        currentStatus: ShipmentStatus.IN_TRANSIT_FINAL,
        carrierName: 'Maersk Line',
        eta: new Date(now + 2 * 24 * 3600 * 1000),
        actualDelivery: null,
        stages: this.createDefaultStagesForShipment('shipment-e4421', [
          950, 3800, 650, 1520, 600,
        ]),
        alerts: [
          {
            id: 'alert-2',
            shipmentId: 'shipment-e4421',
            title:
              'Missing Commercial Invoice Document for Manifest ORD-0941',
            description:
              'Air Freight Cargo grounded pending phytosanitary certificate verification.',
            severity: AlertSeverity.HIGH,
            status: AlertStatus.OPEN,
            slaDeadline: new Date(now + 5 * 3600 * 1000),
            financialImpactUsd: 18500,
            resolutionNotes: null,
            resolvedAt: null,
            createdAt: new Date(now - 2 * 3600 * 1000),
            updatedAt: new Date(now - 2 * 3600 * 1000),
          },
        ] as any,
        notes: [] as any,
        createdAt: new Date(now - 8 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 2 * 3600 * 1000),
      },
      {
        id: 'shipment-a1092',
        trackingNumber: 'CP-2026-A1092',
        origin: 'Incheon Intl, KR',
        destination: 'Frankfurt CargoCity, DE',
        currentStatus: ShipmentStatus.DELIVERED,
        carrierName: 'Lufthansa Cargo',
        eta: new Date(now - 3 * 24 * 3600 * 1000),
        actualDelivery: new Date(now - 3 * 24 * 3600 * 1000),
        stages: this.createDefaultStagesForShipment('shipment-a1092', [
          1800, 7100, 500, 800, 400,
        ]),
        alerts: [
          {
            id: 'alert-3',
            shipmentId: 'shipment-a1092',
            title: 'Port of Houston Drayage Chassis Shortage',
            description:
              'Intermodal chassis deficit causing terminal dwell time accumulation.',
            severity: AlertSeverity.MEDIUM,
            status: AlertStatus.IN_PROGRESS,
            slaDeadline: new Date(now + 24 * 3600 * 1000),
            financialImpactUsd: 6200,
            resolutionNotes: null,
            resolvedAt: null,
            createdAt: new Date(now - 3 * 3600 * 1000),
            updatedAt: new Date(now - 3 * 3600 * 1000),
          },
        ] as any,
        notes: [] as any,
        createdAt: new Date(now - 14 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 3 * 24 * 3600 * 1000),
      },
      {
        id: 'shipment-mxus-001',
        trackingNumber: 'CP-MXUS-2026-001',
        origin: 'Monterrey Assembly, MX',
        destination: 'DFW Fulfillment, US',
        currentStatus: ShipmentStatus.IN_TRANSIT_ORIGIN,
        carrierName: 'TUM Logistica',
        eta: new Date(now + 2 * 24 * 3600 * 1000),
        actualDelivery: null,
        stages: this.createDefaultStagesForShipment('shipment-mxus-001', [
          800, 1900, 750, 1100, 500,
        ]),
        alerts: [
          {
            id: 'alert-4',
            shipmentId: 'shipment-mxus-001',
            title: 'Laredo Commercial Seal Verification Cleared',
            description:
              'Random border inspection resolved without physical tampering.',
            severity: AlertSeverity.LOW,
            status: AlertStatus.RESOLVED,
            slaDeadline: new Date(now - 24 * 3600 * 1000),
            financialImpactUsd: 0,
            resolvedAt: new Date(now - 60 * 60 * 1000),
            resolutionNotes:
              'Customs seal serial numbers cross-checked and matched manifest',
            createdAt: new Date(now - 36 * 3600 * 1000),
            updatedAt: new Date(now - 60 * 60 * 1000),
          },
        ] as any,
        notes: [] as any,
        createdAt: new Date(now - 3 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        id: 'shipment-mxus-002',
        trackingNumber: 'CP-MXUS-2026-002',
        origin: 'Monterrey Assembly, MX',
        destination: 'Chicago Depot, US',
        currentStatus: ShipmentStatus.IN_TRANSIT_ORIGIN,
        carrierName: 'BNSF Railway',
        eta: new Date(now + 4 * 24 * 3600 * 1000),
        actualDelivery: null,
        stages: this.createDefaultStagesForShipment('shipment-mxus-002', [
          850, 2400, 800, 1400, 600,
        ]),
        alerts: [] as any,
        notes: [] as any,
        createdAt: new Date(now - 2 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 2 * 24 * 3600 * 1000),
      },
      {
        id: 'shipment-mxus-003',
        trackingNumber: 'CP-MXUS-2026-003',
        origin: 'Guadalajara Hub, MX',
        destination: 'DFW Fulfillment, US',
        currentStatus: ShipmentStatus.CUSTOMS_HOLD,
        carrierName: 'Schneider National',
        eta: new Date(now + 3 * 24 * 3600 * 1000),
        actualDelivery: null,
        stages: this.createDefaultStagesForShipment('shipment-mxus-003', [
          900, 2100, 850, 1200, 550,
        ]),
        alerts: [] as any,
        notes: [] as any,
        createdAt: new Date(now - 2 * 24 * 3600 * 1000),
        updatedAt: new Date(now - 2 * 24 * 3600 * 1000),
      },
    ];
  }

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

    if (this.isDbAvailable) {
      try {
        return await this.prisma.shipment.create({
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
      } catch (error) {
        this.logger.warn(
          `Database query failed during create: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo shipments.`,
        );
      }
    }

    const now = new Date();
    const newShipmentId = `shipment-${Date.now()}`;
    const newStages = stagesCreateData.map((s, idx) => ({
      id: `stage-${newShipmentId}-${idx + 1}`,
      shipmentId: newShipmentId,
      stageType: s.stageType,
      stageOrder: s.stageOrder,
      contractedCost: s.contractedCost,
      actualCost: s.actualCost,
      variance: s.variance,
      variancePercent: s.variancePercent,
      currency: s.currency,
      status: s.status,
      auditNotes: s.auditNotes ?? null,
      createdAt: now,
      updatedAt: now,
    }));

    const createdShipment: any = {
      id: newShipmentId,
      trackingNumber,
      origin: dto.origin,
      destination: dto.destination,
      carrierName: dto.carrierName,
      currentStatus: ShipmentStatus.DRAFT,
      eta: new Date(dto.eta),
      actualDelivery: null,
      stages: newStages,
      alerts: [],
      notes: [],
      _count: {
        alerts: 0,
        notes: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.demoShipments.unshift(createdShipment);
    return createdShipment;
  }

  /**
   * Paginated shipment search and filtering with stages and alerts count.
   */
  async findAll(query: ShipmentQueryDto): Promise<PaginatedShipmentsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (this.isDbAvailable) {
      try {
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
      } catch (error) {
        this.logger.warn(
          `Database query failed during findAll: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo shipments.`,
        );
      }
    }

    let filtered = [...this.demoShipments];

    if (query.status) {
      filtered = filtered.filter((s) => s.currentStatus === query.status);
    }

    if (query.origin) {
      const originLower = query.origin.toLowerCase();
      filtered = filtered.filter((s) =>
        s.origin.toLowerCase().includes(originLower),
      );
    }

    if (query.destination) {
      const destLower = query.destination.toLowerCase();
      filtered = filtered.filter((s) =>
        s.destination.toLowerCase().includes(destLower),
      );
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(searchLower) ||
          s.origin.toLowerCase().includes(searchLower) ||
          s.destination.toLowerCase().includes(searchLower) ||
          s.carrierName.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paged = filtered.slice(skip, skip + limit);

    const items: ShipmentListItem[] = paged.map((shipment) => ({
      ...shipment,
      alertsCount: (shipment as any).alerts?.length ?? 0,
      _count: {
        alerts: (shipment as any).alerts?.length ?? 0,
      },
    }));

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
    if (this.isDbAvailable) {
      try {
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
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during findOne for ${id}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo shipments.`,
        );
      }
    }

    const demo = this.demoShipments.find(
      (s) => s.id === id || s.trackingNumber === id,
    );
    if (!demo) {
      throw new NotFoundException(`Shipment with ID "${id}" not found`);
    }

    return demo;
  }

  /**
   * Updates shipment status and sets actualDelivery if DELIVERED.
   */
  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    if (this.isDbAvailable) {
      try {
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

        return await this.prisma.shipment.update({
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
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during updateStatus for ${id}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo shipments.`,
        );
      }
    }

    const demo = this.demoShipments.find(
      (s) => s.id === id || s.trackingNumber === id,
    );
    if (!demo) {
      throw new NotFoundException(`Shipment with ID "${id}" not found`);
    }

    demo.currentStatus = dto.currentStatus;
    if (dto.currentStatus === ShipmentStatus.DELIVERED) {
      demo.actualDelivery = new Date();
    }
    demo.updatedAt = new Date();

    return {
      ...demo,
      _count: {
        alerts: (demo as any).alerts?.length ?? 0,
      },
    };
  }
}

