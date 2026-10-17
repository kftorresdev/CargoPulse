import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';
import { ResolveAlertDto } from './dto/resolve-alert.dto.js';
import { AlertQueryDto } from './dto/alert-query.dto.js';
import { AlertKpisDto } from './dto/alert-kpis.dto.js';
import { AlertResponseDto } from './dto/alert-response.dto.js';

export interface DemoAlertItem {
  id: string;
  incidentNumber?: string;
  shipmentId: string;
  shipmentTracking: string;
  carrier: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  slaDeadline: Date;
  financialImpactUsd: number;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  shipment: {
    trackingNumber: string;
    carrierName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AlertCenterService {
  private readonly logger = new Logger(AlertCenterService.name);
  private demoAlerts: DemoAlertItem[] = this.createInitialDemoAlerts();

  constructor(private readonly prisma: PrismaService) {}

  private get isDbAvailable(): boolean {
    return this.prisma?.isConnected !== false;
  }

  private createInitialDemoAlerts(): DemoAlertItem[] {
    const now = Date.now();
    return [
      {
        id: 'alert-1',
        incidentNumber: 'INC-2026-8819',
        shipmentId: 'CP-2026-X9810',
        shipmentTracking: 'CP-2026-X9810',
        carrier: 'OceanBridge Global',
        title: 'Vessel Berth Delay Exceeding 18 Hours (MAERSK MC-KINNEY)',
        description:
          '340 Refrigerated Pharma Containers at risk of cold-chain deviation.',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        slaDeadline: new Date(now + 2 * 60 * 60 * 1000), // 2 hours from now
        financialImpactUsd: 45000,
        resolutionNotes: null,
        resolvedAt: null,
        shipment: {
          trackingNumber: 'CP-2026-X9810',
          carrierName: 'OceanBridge Global',
        },
        createdAt: new Date(now - 60 * 60 * 1000),
        updatedAt: new Date(now - 60 * 60 * 1000),
      },
      {
        id: 'alert-2',
        incidentNumber: 'INC-2026-8824',
        shipmentId: 'CP-2026-E4421',
        shipmentTracking: 'CP-2026-E4421',
        carrier: 'Maersk Line',
        title:
          'Missing Commercial Invoice Document for Manifest ORD-0941',
        description:
          'Air Freight Cargo grounded pending phytosanitary certificate verification.',
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
        slaDeadline: new Date(now + 5 * 60 * 60 * 1000), // 5 hours from now
        financialImpactUsd: 18500,
        resolutionNotes: null,
        resolvedAt: null,
        shipment: {
          trackingNumber: 'CP-2026-E4421',
          carrierName: 'Maersk Line',
        },
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 60 * 60 * 1000),
      },
      {
        id: 'alert-3',
        incidentNumber: 'INC-2026-8830',
        shipmentId: 'CP-2026-A1092',
        shipmentTracking: 'CP-2026-A1092',
        carrier: 'Lufthansa Cargo',
        title: 'Port of Houston Drayage Chassis Shortage',
        description:
          'Intermodal chassis deficit causing terminal dwell time accumulation.',
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.IN_PROGRESS,
        slaDeadline: new Date(now + 24 * 60 * 60 * 1000), // 24 hours from now
        financialImpactUsd: 6200,
        resolutionNotes: null,
        resolvedAt: null,
        shipment: {
          trackingNumber: 'CP-2026-A1092',
          carrierName: 'Lufthansa Cargo',
        },
        createdAt: new Date(now - 3 * 60 * 60 * 1000),
        updatedAt: new Date(now - 3 * 60 * 60 * 1000),
      },
      {
        id: 'alert-4',
        incidentNumber: 'INC-2026-8812',
        shipmentId: 'CP-MXUS-2026-001',
        shipmentTracking: 'CP-MXUS-2026-001',
        carrier: 'TUM Logistica',
        title: 'Laredo Commercial Seal Verification Cleared',
        description:
          'Random border inspection resolved without physical tampering.',
        severity: AlertSeverity.LOW,
        status: AlertStatus.RESOLVED,
        slaDeadline: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
        financialImpactUsd: 0,
        resolvedAt: new Date(now - 60 * 60 * 1000), // 1 hour ago
        resolutionNotes:
          'Customs seal serial numbers cross-checked and matched manifest',
        shipment: {
          trackingNumber: 'CP-MXUS-2026-001',
          carrierName: 'TUM Logistica',
        },
        createdAt: new Date(now - 36 * 60 * 60 * 1000),
        updatedAt: new Date(now - 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Helper method to calculate dynamic SLA remaining duration string.
   * Computes remaining time between now and slaDeadline:
   * Returns format 'DD:HH:MM' or 'BREACHED' if past deadline.
   */
  calculateSlaRemaining(slaDeadline: Date | string): string {
    const deadlineTime = new Date(slaDeadline).getTime();
    const nowTime = Date.now();
    const diffMs = deadlineTime - nowTime;

    if (diffMs <= 0) {
      return 'BREACHED';
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const dd = String(days).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    return `${dd}:${hh}:${mm}`;
  }

  /**
   * Lists alerts filtered optionally by status and severity, including
   * shipment tracking, carrier, and dynamic SLA remaining status.
   */
  async findAll(query: AlertQueryDto): Promise<AlertResponseDto[]> {
    if (this.isDbAvailable) {
      try {
        const alerts = await this.prisma.alert.findMany({
          where: {
            ...(query.status ? { status: query.status } : {}),
            ...(query.severity ? { severity: query.severity } : {}),
          },
          include: {
            shipment: {
              select: {
                trackingNumber: true,
                carrierName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return alerts.map((alert) => ({
          id: alert.id,
          shipmentId: alert.shipmentId,
          shipmentTracking: alert.shipment.trackingNumber,
          carrier: alert.shipment.carrierName,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          slaDeadline: alert.slaDeadline,
          slaRemaining: this.calculateSlaRemaining(alert.slaDeadline),
          financialImpactUsd: alert.financialImpactUsd,
          resolutionNotes: alert.resolutionNotes,
          resolvedAt: alert.resolvedAt,
          shipment: alert.shipment,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt,
        }));
      } catch (error) {
        this.logger.warn(
          `Database query failed during findAll: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo alerts.`,
        );
      }
    }

    let filtered = [...this.demoAlerts];
    if (query.status) {
      filtered = filtered.filter((a) => a.status === query.status);
    }
    if (query.severity) {
      filtered = filtered.filter((a) => a.severity === query.severity);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered.map((alert) => ({
      id: alert.id,
      shipmentId: alert.shipmentId,
      shipmentTracking: alert.shipmentTracking,
      carrier: alert.carrier,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      slaDeadline: alert.slaDeadline,
      slaRemaining: this.calculateSlaRemaining(alert.slaDeadline),
      financialImpactUsd: alert.financialImpactUsd,
      resolutionNotes: alert.resolutionNotes,
      resolvedAt: alert.resolvedAt,
      shipment: alert.shipment,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
      ...(alert.incidentNumber ? { incidentNumber: alert.incidentNumber } : {}),
    }));
  }

  /**
   * Calculates high-level KPIs across all alerts:
   * counts totalAlerts, criticalCount, highCount, mediumCount, lowCount,
   * openCount, resolvedCount, totalFinancialImpactUsd (sum of open/in_progress alerts),
   * and slaBreachedCount.
   */
  async getKpis(): Promise<AlertKpisDto> {
    if (this.isDbAvailable) {
      try {
        const alerts = await this.prisma.alert.findMany({
          select: {
            severity: true,
            status: true,
            slaDeadline: true,
            financialImpactUsd: true,
            resolvedAt: true,
          },
        });

        return this.calculateKpis(alerts);
      } catch (error) {
        this.logger.warn(
          `Database query failed during getKpis: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo alerts.`,
        );
      }
    }

    return this.calculateKpis(this.demoAlerts);
  }

  private calculateKpis(
    alerts: Array<{
      severity: AlertSeverity;
      status: AlertStatus;
      slaDeadline: Date;
      financialImpactUsd: number;
      resolvedAt: Date | null;
    }>,
  ): AlertKpisDto {
    const now = new Date();

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let openCount = 0;
    let resolvedCount = 0;
    let totalFinancialImpactUsd = 0;
    let slaBreachedCount = 0;

    for (const alert of alerts) {
      // Severity breakdown
      if (alert.severity === AlertSeverity.CRITICAL) criticalCount++;
      else if (alert.severity === AlertSeverity.HIGH) highCount++;
      else if (alert.severity === AlertSeverity.MEDIUM) mediumCount++;
      else if (alert.severity === AlertSeverity.LOW) lowCount++;

      // Status breakdown & Financial impact
      if (alert.status === AlertStatus.OPEN) {
        openCount++;
        totalFinancialImpactUsd += alert.financialImpactUsd;
      } else if (alert.status === AlertStatus.IN_PROGRESS) {
        totalFinancialImpactUsd += alert.financialImpactUsd;
      } else if (alert.status === AlertStatus.RESOLVED) {
        resolvedCount++;
      }

      // SLA Breached condition:
      // - Active alerts (OPEN / IN_PROGRESS) where deadline has passed
      // - RESOLVED alerts where resolution occurred past SLA deadline (or past deadline without resolvedAt)
      const isBreached =
        alert.status === AlertStatus.RESOLVED
          ? alert.resolvedAt
            ? new Date(alert.resolvedAt).getTime() >
              new Date(alert.slaDeadline).getTime()
            : new Date(alert.slaDeadline).getTime() < now.getTime()
          : new Date(alert.slaDeadline).getTime() < now.getTime();

      if (isBreached) {
        slaBreachedCount++;
      }
    }

    return {
      totalAlerts: alerts.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      openCount,
      resolvedCount,
      totalFinancialImpactUsd: Number(totalFinancialImpactUsd.toFixed(2)),
      slaBreachedCount,
    };
  }

  /**
   * Creates a new operational alert associated with a shipment.
   */
  async createAlert(dto: CreateAlertDto): Promise<AlertResponseDto> {
    if (this.isDbAvailable) {
      try {
        const shipment = await this.prisma.shipment.findUnique({
          where: { id: dto.shipmentId },
          select: { id: true, trackingNumber: true, carrierName: true },
        });

        if (!shipment) {
          throw new NotFoundException(
            `Shipment with ID ${dto.shipmentId} not found`,
          );
        }

        const alert = await this.prisma.alert.create({
          data: {
            shipmentId: dto.shipmentId,
            title: dto.title,
            description: dto.description,
            severity: dto.severity,
            slaDeadline: new Date(dto.slaDeadline),
            financialImpactUsd: Number(dto.financialImpactUsd.toFixed(2)),
            status: AlertStatus.OPEN,
          },
          include: {
            shipment: {
              select: {
                trackingNumber: true,
                carrierName: true,
              },
            },
          },
        });

        return {
          id: alert.id,
          shipmentId: alert.shipmentId,
          shipmentTracking: alert.shipment.trackingNumber,
          carrier: alert.shipment.carrierName,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          slaDeadline: alert.slaDeadline,
          slaRemaining: this.calculateSlaRemaining(alert.slaDeadline),
          financialImpactUsd: alert.financialImpactUsd,
          resolutionNotes: alert.resolutionNotes,
          resolvedAt: alert.resolvedAt,
          shipment: alert.shipment,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt,
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during createAlert: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo alerts.`,
        );
      }
    }

    const carrierMap: Record<string, string> = {
      'CP-2026-X9810': 'OceanBridge Global',
      'CP-2026-E4421': 'Maersk Line',
      'CP-2026-A1092': 'Lufthansa Cargo',
      'CP-MXUS-2026-001': 'TUM Logistica',
      'CP-MXUS-2026-002': 'BNSF Railway',
      'CP-MXUS-2026-003': 'Schneider National',
    };

    const trackingNumber = dto.shipmentId;
    const carrierName = carrierMap[dto.shipmentId] || 'OceanBridge Global';

    const newAlert: DemoAlertItem = {
      id: `alert-${Date.now()}`,
      shipmentId: dto.shipmentId,
      shipmentTracking: trackingNumber,
      carrier: carrierName,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
      status: AlertStatus.OPEN,
      slaDeadline: new Date(dto.slaDeadline),
      financialImpactUsd: Number(dto.financialImpactUsd.toFixed(2)),
      resolutionNotes: null,
      resolvedAt: null,
      shipment: {
        trackingNumber,
        carrierName,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.demoAlerts.unshift(newAlert);

    return {
      id: newAlert.id,
      shipmentId: newAlert.shipmentId,
      shipmentTracking: newAlert.shipmentTracking,
      carrier: newAlert.carrier,
      title: newAlert.title,
      description: newAlert.description,
      severity: newAlert.severity,
      status: newAlert.status,
      slaDeadline: newAlert.slaDeadline,
      slaRemaining: this.calculateSlaRemaining(newAlert.slaDeadline),
      financialImpactUsd: newAlert.financialImpactUsd,
      resolutionNotes: newAlert.resolutionNotes,
      resolvedAt: newAlert.resolvedAt,
      shipment: newAlert.shipment,
      createdAt: newAlert.createdAt,
      updatedAt: newAlert.updatedAt,
    };
  }

  /**
   * Resolves an existing alert with mandatory resolution notes and records resolvedAt timestamp.
   */
  async resolveAlert(
    id: string,
    dto: ResolveAlertDto,
  ): Promise<AlertResponseDto> {
    if (this.isDbAvailable) {
      try {
        const existing = await this.prisma.alert.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new NotFoundException(`Alert with ID ${id} not found`);
        }

        const updated = await this.prisma.alert.update({
          where: { id },
          data: {
            status: AlertStatus.RESOLVED,
            resolvedAt: new Date(),
            resolutionNotes: dto.resolutionNotes,
          },
          include: {
            shipment: {
              select: {
                trackingNumber: true,
                carrierName: true,
              },
            },
          },
        });

        return {
          id: updated.id,
          shipmentId: updated.shipmentId,
          shipmentTracking: updated.shipment.trackingNumber,
          carrier: updated.shipment.carrierName,
          title: updated.title,
          description: updated.description,
          severity: updated.severity,
          status: updated.status,
          slaDeadline: updated.slaDeadline,
          slaRemaining: this.calculateSlaRemaining(updated.slaDeadline),
          financialImpactUsd: updated.financialImpactUsd,
          resolutionNotes: updated.resolutionNotes,
          resolvedAt: updated.resolvedAt,
          shipment: updated.shipment,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during resolveAlert: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo alerts.`,
        );
      }
    }

    const alert = this.demoAlerts.find((a) => a.id === id);
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = dto.resolutionNotes;
    alert.updatedAt = new Date();

    return {
      id: alert.id,
      shipmentId: alert.shipmentId,
      shipmentTracking: alert.shipmentTracking,
      carrier: alert.carrier,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      slaDeadline: alert.slaDeadline,
      slaRemaining: this.calculateSlaRemaining(alert.slaDeadline),
      financialImpactUsd: alert.financialImpactUsd,
      resolutionNotes: alert.resolutionNotes,
      resolvedAt: alert.resolvedAt,
      shipment: alert.shipment,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
      ...(alert.incidentNumber ? { incidentNumber: alert.incidentNumber } : {}),
    };
  }
}

