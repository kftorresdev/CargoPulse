import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity, AlertStatus } from '@prisma/client';

export class AlertShipmentInfoDto {
  @ApiProperty({
    example: 'CP-2026-X9810',
    description: 'Shipment unique tracking number',
  })
  trackingNumber!: string;

  @ApiProperty({
    example: 'OceanBridge Global',
    description: 'Assigned logistics carrier name',
  })
  carrierName!: string;
}

export class AlertResponseDto {
  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Unique alert identifier UUID',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Associated shipment identifier UUID',
  })
  shipmentId!: string;

  @ApiProperty({
    example: 'CP-2026-X9810',
    description: 'Shipment tracking number',
  })
  shipmentTracking!: string;

  @ApiProperty({
    example: 'OceanBridge Global',
    description: 'Carrier name responsible for shipment',
  })
  carrier!: string;

  @ApiProperty({
    example: 'CBP Customs Hold - Intensive Exam Required',
    description: 'Alert summary header',
  })
  title!: string;

  @ApiProperty({
    example: 'Container flagged for agricultural compliance inspection at terminal.',
    description: 'Full narrative description of the disruption',
  })
  description!: string;

  @ApiProperty({
    enum: AlertSeverity,
    example: AlertSeverity.CRITICAL,
    description: 'Severity level (LOW, MEDIUM, HIGH, CRITICAL)',
  })
  severity!: AlertSeverity;

  @ApiProperty({
    enum: AlertStatus,
    example: AlertStatus.OPEN,
    description: 'Lifecycle status of alert (OPEN, IN_PROGRESS, RESOLVED)',
  })
  status!: AlertStatus;

  @ApiProperty({
    example: '2026-10-18T18:00:00.000Z',
    description: 'Resolution SLA deadline timestamp',
  })
  slaDeadline!: Date;

  @ApiProperty({
    example: '01:05:32',
    description: 'Dynamic SLA remaining duration in DD:HH:MM format, or BREACHED if expired',
  })
  slaRemaining!: string;

  @ApiProperty({
    example: 1450.0,
    description: 'Estimated financial impact in USD',
  })
  financialImpactUsd!: number;

  @ApiPropertyOptional({
    example: 'Documentation cleared with CBP port authority.',
    description: 'Resolution notes entered when closing the alert',
  })
  resolutionNotes?: string | null;

  @ApiPropertyOptional({
    example: '2026-10-17T10:15:00.000Z',
    description: 'Timestamp when alert was resolved',
  })
  resolvedAt?: Date | null;

  @ApiProperty({
    type: () => AlertShipmentInfoDto,
    description: 'Nested shipment details',
  })
  shipment?: AlertShipmentInfoDto;

  @ApiProperty({
    example: '2026-10-16T12:00:00.000Z',
    description: 'Alert creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-10-16T12:00:00.000Z',
    description: 'Alert last updated timestamp',
  })
  updatedAt!: Date;
}
