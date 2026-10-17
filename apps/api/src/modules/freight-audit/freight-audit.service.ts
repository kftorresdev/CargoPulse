import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FreightStage, StageStatus, StageType } from '@prisma/client';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateStageAuditDto } from './dto/update-stage-audit.dto.js';
import {
  FreightAuditSummaryDto,
  StageBreakdownDto,
} from './dto/freight-audit-summary.dto.js';

export interface DemoStage {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  carrierName: string;
  stageType: StageType;
  stageOrder: number;
  contractedCost: number;
  actualCost: number;
  variance: number;
  variancePercent: number;
  currency: string;
  status: StageStatus;
  auditNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEMO_STAGES: DemoStage[] = [
  // 1. Shipment CP-2026-X9810 (OceanBridge Global)
  {
    id: 'stage-x9810-1',
    shipmentId: 'CP-2026-X9810',
    trackingNumber: 'CP-2026-X9810',
    carrierName: 'OceanBridge Global',
    stageType: StageType.ORIGIN_HANDLING,
    stageOrder: 1,
    contractedCost: 1200.0,
    actualCost: 1200.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Export documentation and container drayage verified.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-x9810-2',
    shipmentId: 'CP-2026-X9810',
    trackingNumber: 'CP-2026-X9810',
    carrierName: 'OceanBridge Global',
    stageType: StageType.TRANSIT_1,
    stageOrder: 2,
    contractedCost: 4500.0,
    actualCost: 4850.0,
    variance: 350.0,
    variancePercent: 7.78,
    currency: 'USD',
    status: StageStatus.DISPUTED,
    auditNotes: 'Bunker adjustment factor surcharge disputed with ocean carrier.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-x9810-3',
    shipmentId: 'CP-2026-X9810',
    trackingNumber: 'CP-2026-X9810',
    carrierName: 'OceanBridge Global',
    stageType: StageType.CUSTOMS_BORDER,
    stageOrder: 3,
    contractedCost: 850.0,
    actualCost: 1250.0,
    variance: 400.0,
    variancePercent: 47.06,
    currency: 'USD',
    status: StageStatus.PENDING,
    auditNotes: 'Intensive exam fee applied due to random CBP inspection.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-x9810-4',
    shipmentId: 'CP-2026-X9810',
    trackingNumber: 'CP-2026-X9810',
    carrierName: 'OceanBridge Global',
    stageType: StageType.TRANSIT_2,
    stageOrder: 4,
    contractedCost: 1600.0,
    actualCost: 1600.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.PENDING,
    auditNotes: 'Rail intermodal booking confirmed.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-x9810-5',
    shipmentId: 'CP-2026-X9810',
    trackingNumber: 'CP-2026-X9810',
    carrierName: 'OceanBridge Global',
    stageType: StageType.FINAL_DESTINATION,
    stageOrder: 5,
    contractedCost: 750.0,
    actualCost: 750.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.PENDING,
    auditNotes: 'Final warehouse delivery scheduled.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },

  // 2. Shipment CP-2026-E4421 (Maersk Line)
  {
    id: 'stage-e4421-1',
    shipmentId: 'CP-2026-E4421',
    trackingNumber: 'CP-2026-E4421',
    carrierName: 'Maersk Line',
    stageType: StageType.ORIGIN_HANDLING,
    stageOrder: 1,
    contractedCost: 950.0,
    actualCost: 950.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Origin terminal handling fees matched contract.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-e4421-2',
    shipmentId: 'CP-2026-E4421',
    trackingNumber: 'CP-2026-E4421',
    carrierName: 'Maersk Line',
    stageType: StageType.TRANSIT_1,
    stageOrder: 2,
    contractedCost: 3800.0,
    actualCost: 3800.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Transatlantic ocean freight cleared.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-e4421-3',
    shipmentId: 'CP-2026-E4421',
    trackingNumber: 'CP-2026-E4421',
    carrierName: 'Maersk Line',
    stageType: StageType.CUSTOMS_BORDER,
    stageOrder: 3,
    contractedCost: 650.0,
    actualCost: 650.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Cleared Newark entry via automated commercial environment.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-e4421-4',
    shipmentId: 'CP-2026-E4421',
    trackingNumber: 'CP-2026-E4421',
    carrierName: 'Maersk Line',
    stageType: StageType.TRANSIT_2,
    stageOrder: 4,
    contractedCost: 1400.0,
    actualCost: 1520.0,
    variance: 120.0,
    variancePercent: 8.57,
    currency: 'USD',
    status: StageStatus.DISPUTED,
    auditNotes: 'Chassis split charge added without prior notification.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-e4421-5',
    shipmentId: 'CP-2026-E4421',
    trackingNumber: 'CP-2026-E4421',
    carrierName: 'Maersk Line',
    stageType: StageType.FINAL_DESTINATION,
    stageOrder: 5,
    contractedCost: 600.0,
    actualCost: 600.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.PENDING,
    auditNotes: 'Cross-dock delivery window booked for 14:00 CST.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },

  // 3. Shipment CP-2026-A1092 (Lufthansa Cargo)
  {
    id: 'stage-a1092-1',
    shipmentId: 'CP-2026-A1092',
    trackingNumber: 'CP-2026-A1092',
    carrierName: 'Lufthansa Cargo',
    stageType: StageType.ORIGIN_HANDLING,
    stageOrder: 1,
    contractedCost: 1800.0,
    actualCost: 1800.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Cold chain verification passed at ICN warehouse.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-a1092-2',
    shipmentId: 'CP-2026-A1092',
    trackingNumber: 'CP-2026-A1092',
    carrierName: 'Lufthansa Cargo',
    stageType: StageType.TRANSIT_1,
    stageOrder: 2,
    contractedCost: 7200.0,
    actualCost: 7100.0,
    variance: -100.0,
    variancePercent: -1.39,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Air freight under contracted volume tier rebate applied.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-a1092-3',
    shipmentId: 'CP-2026-A1092',
    trackingNumber: 'CP-2026-A1092',
    carrierName: 'Lufthansa Cargo',
    stageType: StageType.CUSTOMS_BORDER,
    stageOrder: 3,
    contractedCost: 500.0,
    actualCost: 500.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'EU customs entry processed under ATLAS system.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-a1092-4',
    shipmentId: 'CP-2026-A1092',
    trackingNumber: 'CP-2026-A1092',
    carrierName: 'Lufthansa Cargo',
    stageType: StageType.TRANSIT_2,
    stageOrder: 4,
    contractedCost: 800.0,
    actualCost: 800.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Temperature controlled dedicated truck to distribution center.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
  {
    id: 'stage-a1092-5',
    shipmentId: 'CP-2026-A1092',
    trackingNumber: 'CP-2026-A1092',
    carrierName: 'Lufthansa Cargo',
    stageType: StageType.FINAL_DESTINATION,
    stageOrder: 5,
    contractedCost: 400.0,
    actualCost: 400.0,
    variance: 0.0,
    variancePercent: 0.0,
    currency: 'USD',
    status: StageStatus.APPROVED,
    auditNotes: 'Proof of Delivery signed and archived in document store.',
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  },
];

@Injectable()
export class FreightAuditService {
  public static readonly DEMO_STAGES: DemoStage[] = DEMO_STAGES;
  private readonly logger = new Logger(FreightAuditService.name);
  private readonly demoStages: DemoStage[] = DEMO_STAGES.map((s) => ({ ...s }));

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper property to determine if database mode is active.
   * Treats undefined as active (for unit tests where isConnected was not mocked).
   */
  private get isDbAvailable(): boolean {
    return this.prisma?.isConnected !== false;
  }

  /**
   * Calculates aggregated financial metrics across all freight stages,
   * including totals, overall variance percentage, disputed count, and breakdown by stage type.
   */
  async getSummary(): Promise<FreightAuditSummaryDto> {
    if (this.isDbAvailable) {
      try {
        const stages = await this.prisma.freightStage.findMany();
        return this.calculateSummaryFromStages(stages);
      } catch (error) {
        this.logger.warn(
          `Database query failed during getSummary: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo stages.`,
        );
      }
    }

    return this.calculateSummaryFromStages(this.demoStages);
  }

  /**
   * Returns all 5 stages for a shipment with variance details and variance percentage.
   * Supports querying by shipment UUID or tracking number (e.g. 'CP-2026-X9810').
   */
  async getShipmentAudit(shipmentId: string): Promise<FreightStage[]> {
    if (this.isDbAvailable) {
      try {
        let shipment = await this.prisma.shipment.findUnique({
          where: { id: shipmentId },
        });

        if (!shipment) {
          shipment = await this.prisma.shipment
            .findUnique({
              where: { trackingNumber: shipmentId },
            })
            .catch(() => null);
        }

        if (!shipment) {
          const demoMatches = this.findDemoStagesByShipment(shipmentId);
          if (demoMatches.length > 0) {
            return demoMatches;
          }
          throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        return await this.prisma.freightStage.findMany({
          where: { shipmentId: shipment.id },
          orderBy: { stageOrder: 'asc' },
        });
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during getShipmentAudit for ${shipmentId}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo stages.`,
        );
      }
    }

    const demoMatches = this.findDemoStagesByShipment(shipmentId);
    if (demoMatches.length > 0) {
      return demoMatches;
    }

    // Default fallback to seed shipment CP-2026-X9810 if unknown ID in offline mode
    return this.findDemoStagesByShipment('CP-2026-X9810');
  }

  /**
   * Updates stage audit actual cost, notes, and audit status.
   * Enforces automatic variance rules:
   * - If variancePercent > 5 and status not specified, status = DISPUTED
   * - If variancePercent <= 0 and status not specified, status = APPROVED
   */
  async updateStageAudit(
    stageId: string,
    dto: UpdateStageAuditDto,
  ): Promise<FreightStage> {
    if (this.isDbAvailable) {
      try {
        const stage = await this.prisma.freightStage.findUnique({
          where: { id: stageId },
        });

        if (!stage) {
          const demoIndex = this.demoStages.findIndex((s) => s.id === stageId);
          if (demoIndex === -1) {
            throw new NotFoundException(
              `Freight stage with ID ${stageId} not found`,
            );
          }
          return this.updateDemoStage(demoIndex, dto);
        }

        const actualCost = Number(dto.actualCost.toFixed(2));
        const contractedCost = stage.contractedCost;
        const variance = Number((actualCost - contractedCost).toFixed(2));
        const variancePercent =
          contractedCost > 0
            ? Number(((variance / contractedCost) * 100).toFixed(2))
            : 0;

        let status = dto.status;
        if (!status) {
          if (variancePercent > 5) {
            status = StageStatus.DISPUTED;
          } else if (variancePercent <= 0) {
            status = StageStatus.APPROVED;
          } else {
            status = stage.status;
          }
        }

        return await this.prisma.freightStage.update({
          where: { id: stageId },
          data: {
            actualCost,
            variance,
            variancePercent,
            status,
            ...(dto.auditNotes !== undefined
              ? { auditNotes: dto.auditNotes }
              : {}),
          },
        });
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during updateStageAudit for ${stageId}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo stages.`,
        );
      }
    }

    const demoIndex = this.demoStages.findIndex((s) => s.id === stageId);
    if (demoIndex === -1) {
      throw new NotFoundException(`Freight stage with ID ${stageId} not found`);
    }

    return this.updateDemoStage(demoIndex, dto);
  }

  /**
   * Generates and exports the freight cost audit report to Excel (.xlsx) with styled headers,
   * formatted currency & percentage cells, and conditional color highlighting.
   */
  async exportToExcel(res: Response): Promise<void> {
    interface ExcelRowData {
      trackingNumber: string;
      carrier: string;
      stageType: StageType;
      stageOrder: number;
      contractedCost: number;
      actualCost: number;
      variance: number;
      variancePercent: number;
      status: StageStatus;
      auditNotes: string | null;
    }

    let rows: ExcelRowData[] | null = null;

    if (this.isDbAvailable) {
      try {
        const stages = await this.prisma.freightStage.findMany({
          include: {
            shipment: {
              select: {
                trackingNumber: true,
                carrierName: true,
              },
            },
          },
          orderBy: [
            { shipment: { trackingNumber: 'asc' } },
            { stageOrder: 'asc' },
          ],
        });

        rows = stages.map((stage) => ({
          trackingNumber: stage.shipment.trackingNumber,
          carrier: stage.shipment.carrierName,
          stageType: stage.stageType,
          stageOrder: stage.stageOrder,
          contractedCost: stage.contractedCost,
          actualCost: stage.actualCost,
          variance: stage.variance,
          variancePercent: stage.variancePercent,
          status: stage.status,
          auditNotes: stage.auditNotes,
        }));
      } catch (error) {
        this.logger.warn(
          `Database query failed during exportToExcel: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo stages.`,
        );
        rows = null;
      }
    }

    if (!rows) {
      rows = this.demoStages
        .slice()
        .sort((a, b) => {
          const cmp = a.trackingNumber.localeCompare(b.trackingNumber);
          return cmp !== 0 ? cmp : a.stageOrder - b.stageOrder;
        })
        .map((stage) => ({
          trackingNumber: stage.trackingNumber,
          carrier: stage.carrierName,
          stageType: stage.stageType,
          stageOrder: stage.stageOrder,
          contractedCost: stage.contractedCost,
          actualCost: stage.actualCost,
          variance: stage.variance,
          variancePercent: stage.variancePercent,
          status: stage.status,
          auditNotes: stage.auditNotes,
        }));
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CargoPulse Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Freight Cost Audit');

    worksheet.columns = [
      { header: 'Shipment Tracking', key: 'trackingNumber', width: 22 },
      { header: 'Carrier', key: 'carrier', width: 22 },
      { header: 'Stage', key: 'stageType', width: 22 },
      { header: 'Order', key: 'stageOrder', width: 10 },
      { header: 'Contracted ($)', key: 'contractedCost', width: 18 },
      { header: 'Actual ($)', key: 'actualCost', width: 18 },
      { header: 'Variance ($)', key: 'variance', width: 18 },
      { header: 'Variance (%)', key: 'variancePercent', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Audit Notes', key: 'auditNotes', width: 36 },
    ];

    // Format header row with dark background (#1E293B) and white bold font
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    for (const rowData of rows) {
      const row = worksheet.addRow({
        trackingNumber: rowData.trackingNumber,
        carrier: rowData.carrier,
        stageType: rowData.stageType,
        stageOrder: rowData.stageOrder,
        contractedCost: rowData.contractedCost,
        actualCost: rowData.actualCost,
        variance: rowData.variance,
        variancePercent: rowData.variancePercent / 100,
        status: rowData.status,
        auditNotes: rowData.auditNotes || '',
      });

      row.height = 22;

      // Currency and Percentage formatting
      row.getCell('contractedCost').numFmt = '$#,##0.00';
      row.getCell('actualCost').numFmt = '$#,##0.00';
      row.getCell('variance').numFmt = '$#,##0.00';
      row.getCell('variancePercent').numFmt = '0.00%';

      // Cell alignments
      row.getCell('trackingNumber').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      row.getCell('carrier').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      row.getCell('stageType').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      row.getCell('stageOrder').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      row.getCell('contractedCost').alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      row.getCell('actualCost').alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      row.getCell('variance').alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      row.getCell('variancePercent').alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      row.getCell('status').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      row.getCell('auditNotes').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };

      // Base borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      // Conditional styling:
      // Green background for variance <= 0%
      // Red background for variance > 5%
      // Yellow/Amber for 0% < variance <= 5%
      let fillColor = 'FFDCFCE7'; // Soft Green
      let fontColor = 'FF166534'; // Forest Green
      if (rowData.variancePercent > 5) {
        fillColor = 'FFFEE2E2'; // Soft Red
        fontColor = 'FF991B1B'; // Deep Crimson
      } else if (rowData.variancePercent > 0) {
        fillColor = 'FFFEF3C7'; // Soft Amber / Yellow
        fontColor = 'FF92400E'; // Deep Amber
      }

      const conditionalFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };

      const varianceCell = row.getCell('variance');
      const percentCell = row.getCell('variancePercent');
      const statusCell = row.getCell('status');

      varianceCell.fill = conditionalFill;
      varianceCell.font = { color: { argb: fontColor }, bold: true };

      percentCell.fill = conditionalFill;
      percentCell.font = { color: { argb: fontColor }, bold: true };

      statusCell.fill = conditionalFill;
      statusCell.font = { color: { argb: fontColor }, bold: true };
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=freight-audit-report.xlsx',
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.end(Buffer.from(buffer));
  }

  private calculateSummaryFromStages(
    stages: Array<{
      stageType: StageType;
      stageOrder?: number;
      contractedCost: number;
      actualCost: number;
      status: StageStatus;
    }>,
  ): FreightAuditSummaryDto {
    const totalContractedCost = Number(
      stages.reduce((sum, s) => sum + s.contractedCost, 0).toFixed(2),
    );
    const totalActualCost = Number(
      stages.reduce((sum, s) => sum + s.actualCost, 0).toFixed(2),
    );
    const totalVariance = Number(
      (totalActualCost - totalContractedCost).toFixed(2),
    );
    const variancePercentage =
      totalContractedCost > 0
        ? Number(((totalVariance / totalContractedCost) * 100).toFixed(2))
        : 0;
    const disputedStagesCount = stages.filter(
      (s) => s.status === StageStatus.DISPUTED,
    ).length;

    const stageTypes: StageType[] = [
      StageType.ORIGIN_HANDLING,
      StageType.TRANSIT_1,
      StageType.CUSTOMS_BORDER,
      StageType.TRANSIT_2,
      StageType.FINAL_DESTINATION,
    ];

    const breakdown: StageBreakdownDto[] = stageTypes.map((stageType) => {
      const typeStages = stages.filter((s) => s.stageType === stageType);
      const stageCount = typeStages.length;
      const stageContracted = Number(
        typeStages.reduce((sum, s) => sum + s.contractedCost, 0).toFixed(2),
      );
      const stageActual = Number(
        typeStages.reduce((sum, s) => sum + s.actualCost, 0).toFixed(2),
      );
      const stageVariance = Number((stageActual - stageContracted).toFixed(2));
      const stageVariancePercentage =
        stageContracted > 0
          ? Number(((stageVariance / stageContracted) * 100).toFixed(2))
          : 0;
      const disputedCount = typeStages.filter(
        (s) => s.status === StageStatus.DISPUTED,
      ).length;

      return {
        stageType,
        stageCount,
        totalContractedCost: stageContracted,
        totalActualCost: stageActual,
        totalVariance: stageVariance,
        variancePercentage: stageVariancePercentage,
        disputedStagesCount: disputedCount,
      };
    });

    return {
      totalContractedCost,
      totalActualCost,
      totalVariance,
      variancePercentage,
      disputedStagesCount,
      stageBreakdown: breakdown,
      breakdown,
    };
  }

  private findDemoStagesByShipment(shipmentId: string): FreightStage[] {
    const normalized = shipmentId.trim().toLowerCase();
    const stages = this.demoStages.filter(
      (s) =>
        s.shipmentId.toLowerCase() === normalized ||
        s.trackingNumber.toLowerCase() === normalized,
    );

    return stages
      .sort((a, b) => a.stageOrder - b.stageOrder)
      .map((s) => ({
        id: s.id,
        shipmentId: s.shipmentId,
        stageType: s.stageType,
        stageOrder: s.stageOrder,
        contractedCost: s.contractedCost,
        actualCost: s.actualCost,
        variance: s.variance,
        variancePercent: s.variancePercent,
        currency: s.currency,
        status: s.status,
        auditNotes: s.auditNotes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  }

  private updateDemoStage(
    index: number,
    dto: UpdateStageAuditDto,
  ): FreightStage {
    const stage = this.demoStages[index];
    const actualCost = Number(dto.actualCost.toFixed(2));
    const contractedCost = stage.contractedCost;
    const variance = Number((actualCost - contractedCost).toFixed(2));
    const variancePercent =
      contractedCost > 0
        ? Number(((variance / contractedCost) * 100).toFixed(2))
        : 0;

    let status = dto.status;
    if (!status) {
      if (variancePercent > 5) {
        status = StageStatus.DISPUTED;
      } else if (variancePercent <= 0) {
        status = StageStatus.APPROVED;
      } else {
        status = stage.status;
      }
    }

    const updated: DemoStage = {
      ...stage,
      actualCost,
      variance,
      variancePercent,
      status,
      auditNotes:
        dto.auditNotes !== undefined ? dto.auditNotes : stage.auditNotes,
      updatedAt: new Date(),
    };

    this.demoStages[index] = updated;

    return {
      id: updated.id,
      shipmentId: updated.shipmentId,
      stageType: updated.stageType,
      stageOrder: updated.stageOrder,
      contractedCost: updated.contractedCost,
      actualCost: updated.actualCost,
      variance: updated.variance,
      variancePercent: updated.variancePercent,
      currency: updated.currency,
      status: updated.status,
      auditNotes: updated.auditNotes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
