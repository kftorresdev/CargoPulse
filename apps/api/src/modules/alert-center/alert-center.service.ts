import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';
import { ResolveAlertDto } from './dto/resolve-alert.dto.js';
import { AlertQueryDto } from './dto/alert-query.dto.js';
import { AlertKpisDto } from './dto/alert-kpis.dto.js';
import { AlertResponseDto } from './dto/alert-response.dto.js';

@Injectable()
export class AlertCenterService {
  constructor(private readonly prisma: PrismaService) {}

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
  }

  /**
   * Calculates high-level KPIs across all alerts:
   * counts totalAlerts, criticalCount, highCount, mediumCount, lowCount,
   * openCount, resolvedCount, totalFinancialImpactUsd (sum of open/in_progress alerts),
   * and slaBreachedCount.
   */
  async getKpis(): Promise<AlertKpisDto> {
    const alerts = await this.prisma.alert.findMany({
      select: {
        severity: true,
        status: true,
        slaDeadline: true,
        financialImpactUsd: true,
        resolvedAt: true,
      },
    });

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
  }

  /**
   * Resolves an existing alert with mandatory resolution notes and records resolvedAt timestamp.
   */
  async resolveAlert(
    id: string,
    dto: ResolveAlertDto,
  ): Promise<AlertResponseDto> {
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
  }
}
