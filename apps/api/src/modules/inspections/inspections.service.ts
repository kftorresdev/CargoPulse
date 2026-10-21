import { Injectable, Logger } from '@nestjs/common';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateInspectionDto,
  InspectionSyncResult,
} from './dto/create-inspection.dto.js';

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get isDbAvailable(): boolean {
    return this.prisma?.isConnected !== false;
  }

  async createInspection(
    dto: CreateInspectionDto,
    currentUser?: { id?: string; email?: string },
  ): Promise<InspectionSyncResult> {
    const alertTriggered = Boolean(dto.sealMismatch || dto.damagesReported);
    const now = new Date();

    if (this.isDbAvailable) {
      try {
        // Find shipment by UUID or tracking number
        const shipment = await this.prisma.shipment.findFirst({
          where: {
            OR: [
              { id: dto.shipmentId },
              { trackingNumber: dto.shipmentId },
            ],
          },
        });

        if (!shipment) {
          this.logger.warn(
            `Shipment with identifier "${dto.shipmentId}" not found in database. Proceeding without database alert/note linking.`,
          );
        } else {
          const shipmentId = shipment.id;

          // 1. If sealMismatch == true or damagesReported == true, creates an Alert in Prisma
          if (alertTriggered) {
            let title: string;
            let description: string;
            let severity: AlertSeverity;
            let financialImpactUsd = 0;

            if (dto.sealMismatch && dto.damagesReported) {
              title = `Critical Discrepancy: Seal Mismatch & Container Damage (${shipment.trackingNumber})`;
              description = `Physical inspection discrepancy: Seal declared "${dto.sealNumberDeclared || 'N/A'}" vs actual "${dto.sealNumberActual || 'N/A'}". Container condition: "${dto.containerCondition}". Damage description: ${dto.damagesDescription || 'None'}. Signed by: ${dto.signerName}.`;
              severity = AlertSeverity.CRITICAL;
              financialImpactUsd = 2500;
            } else if (dto.sealMismatch) {
              title = `Security Alert: Seal Mismatch Detected (${shipment.trackingNumber})`;
              description = `Seal number mismatch detected during inspection: Declared "${dto.sealNumberDeclared || 'N/A'}" vs Actual "${dto.sealNumberActual || 'N/A'}". Container condition: ${dto.containerCondition}. Signed by: ${dto.signerName}.`;
              severity = AlertSeverity.CRITICAL;
              financialImpactUsd = 1000;
            } else {
              title = `Damage Report: Container Issue (${shipment.trackingNumber})`;
              description = `Container damage reported during inspection: "${dto.containerCondition}". Details: ${dto.damagesDescription || 'No details provided'}. Signed by: ${dto.signerName}.`;
              severity = AlertSeverity.MEDIUM;
              financialImpactUsd = 750;
            }

            await this.prisma.alert.create({
              data: {
                shipmentId,
                title,
                description,
                severity,
                status: AlertStatus.OPEN,
                slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24-hour SLA deadline
                financialImpactUsd,
              },
            });
            this.logger.log(
              `Alert created successfully for shipment ${shipment.trackingNumber} (${title})`,
            );
          }

          // 2. Creates a Note in Prisma documenting the inspection, signer name, and conditions
          let authorId = currentUser?.id;
          if (authorId) {
            const existingUser = await this.prisma.user.findUnique({
              where: { id: authorId },
              select: { id: true },
            });
            if (!existingUser) {
              authorId = undefined;
            }
          }

          if (!authorId) {
            const defaultUser = await this.prisma.user.findFirst({
              select: { id: true },
            });
            if (defaultUser) {
              authorId = defaultUser.id;
            }
          }

          if (authorId) {
            const noteLines = [
              `📋 Mobile Field Inspection Recorded [ID: ${dto.id}]`,
              `• Container Condition: ${dto.containerCondition}`,
              `• Seal Intact: ${dto.sealIntact ? 'Yes' : 'No'}`,
              `• Declared Seal: ${dto.sealNumberDeclared || 'N/A'}`,
              `• Actual Seal: ${dto.sealNumberActual || 'N/A'}`,
              `• Seal Mismatch: ${dto.sealMismatch ? '⚠️ YES' : 'No'}`,
              `• Damages Reported: ${dto.damagesReported ? '⚠️ YES' : 'No'}`,
              dto.damagesDescription ? `• Damage Details: ${dto.damagesDescription}` : null,
              `• Verified & Signed by: ${dto.signerName}`,
              dto.gpsCoordinates ? `• GPS Location: ${dto.gpsCoordinates}` : null,
              dto.photos?.length ? `• Photographic Evidence: ${dto.photos.length} photo(s) captured` : null,
              `• Signature Status: Captured on Mobile Device`,
            ];

            const noteContent = noteLines.filter(Boolean).join('\n');

            await this.prisma.note.create({
              data: {
                shipmentId,
                authorId,
                content: noteContent,
                attachmentUrl: dto.photos?.[0]?.fileName
                  ? `inspection://${dto.photos[0].fileName}`
                  : null,
              },
            });
            this.logger.log(
              `Inspection note created successfully for shipment ${shipment.trackingNumber}`,
            );
          } else {
            this.logger.warn(
              `No user found to associate as author for inspection note on shipment ${shipmentId}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Database error while processing inspection for ${dto.shipmentId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      id: dto.id,
      shipmentId: dto.shipmentId,
      status: 'SYNCED',
      syncedAt: now,
      alertCreated: alertTriggered,
    };
  }
}
