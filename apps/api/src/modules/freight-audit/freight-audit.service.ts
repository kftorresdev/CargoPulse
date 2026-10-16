import { Injectable, NotFoundException } from '@nestjs/common';
import { FreightStage, StageStatus, StageType } from '@prisma/client';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateStageAuditDto } from './dto/update-stage-audit.dto.js';
import {
  FreightAuditSummaryDto,
  StageBreakdownDto,
} from './dto/freight-audit-summary.dto.js';

@Injectable()
export class FreightAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates aggregated financial metrics across all freight stages,
   * including totals, overall variance percentage, disputed count, and breakdown by stage type.
   */
  async getSummary(): Promise<FreightAuditSummaryDto> {
    const stages = await this.prisma.freightStage.findMany();

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
      breakdown,
    };
  }

  /**
   * Returns all 5 stages for a shipment with variance details and variance percentage.
   */
  async getShipmentAudit(shipmentId: string): Promise<FreightStage[]> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    return this.prisma.freightStage.findMany({
      where: { shipmentId },
      orderBy: { stageOrder: 'asc' },
    });
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
    const stage = await this.prisma.freightStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException(`Freight stage with ID ${stageId} not found`);
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

    return this.prisma.freightStage.update({
      where: { id: stageId },
      data: {
        actualCost,
        variance,
        variancePercent,
        status,
        ...(dto.auditNotes !== undefined ? { auditNotes: dto.auditNotes } : {}),
      },
    });
  }

  /**
   * Generates and exports the freight cost audit report to Excel (.xlsx) with styled headers,
   * formatted currency & percentage cells, and conditional color highlighting.
   */
  async exportToExcel(res: Response): Promise<void> {
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

    for (const stage of stages) {
      const row = worksheet.addRow({
        trackingNumber: stage.shipment.trackingNumber,
        carrier: stage.shipment.carrierName,
        stageType: stage.stageType,
        stageOrder: stage.stageOrder,
        contractedCost: stage.contractedCost,
        actualCost: stage.actualCost,
        variance: stage.variance,
        variancePercent: stage.variancePercent / 100,
        status: stage.status,
        auditNotes: stage.auditNotes || '',
      });

      row.height = 22;

      // Currency and Percentage formatting
      row.getCell('contractedCost').numFmt = '$#,##0.00';
      row.getCell('actualCost').numFmt = '$#,##0.00';
      row.getCell('variance').numFmt = '$#,##0.00';
      row.getCell('variancePercent').numFmt = '0.00%';

      // Cell alignments
      row.getCell('trackingNumber').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('carrier').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('stageType').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('stageOrder').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('contractedCost').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('actualCost').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('variance').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('variancePercent').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('auditNotes').alignment = { vertical: 'middle', horizontal: 'left' };

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
      if (stage.variancePercent > 5) {
        fillColor = 'FFFEE2E2'; // Soft Red
        fontColor = 'FF991B1B'; // Deep Crimson
      } else if (stage.variancePercent > 0) {
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
}
