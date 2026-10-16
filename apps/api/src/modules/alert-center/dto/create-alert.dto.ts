import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AlertSeverity } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Associated shipment UUID identifier',
  })
  @IsUUID('4', { message: 'shipmentId must be a valid UUID' })
  @IsNotEmpty({ message: 'shipmentId is required' })
  shipmentId!: string;

  @ApiProperty({
    example: 'Customs Clearance Inspection Delay',
    description: 'Concise summary of the operational alert',
  })
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title!: string;

  @ApiProperty({
    example: 'Container flagged for agricultural compliance inspection at destination port.',
    description: 'Detailed description of the disruption or variance',
  })
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description!: string;

  @ApiProperty({
    enum: AlertSeverity,
    example: AlertSeverity.CRITICAL,
    description: 'Alert severity level (LOW, MEDIUM, HIGH, CRITICAL)',
  })
  @IsEnum(AlertSeverity, {
    message: 'severity must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  severity!: AlertSeverity;

  @ApiProperty({
    example: '2026-10-18T18:00:00.000Z',
    description: 'Resolution SLA deadline in ISO 8601 format',
  })
  @IsISO8601({}, { message: 'slaDeadline must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'slaDeadline is required' })
  slaDeadline!: string;

  @ApiProperty({
    example: 1450.0,
    description: 'Estimated financial impact in USD',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'financialImpactUsd must be a number' })
  @Min(0, { message: 'financialImpactUsd must be greater than or equal to 0' })
  financialImpactUsd!: number;
}
