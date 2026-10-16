import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StageStatus, StageType } from '@prisma/client';

export class CreateFreightStageDto {
  @ApiProperty({
    enum: StageType,
    example: StageType.ORIGIN_HANDLING,
    description: 'Stage type in the 5-leg freight chain',
  })
  @IsEnum(StageType, { message: 'stageType must be a valid StageType enum value' })
  stageType!: StageType;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sequence order of the stage (1 to 5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  stageOrder?: number;

  @ApiProperty({
    example: 1200.0,
    description: 'Contracted cost in USD for this stage',
  })
  @IsNumber({}, { message: 'contractedCost must be a valid number' })
  @Min(0, { message: 'contractedCost cannot be negative' })
  contractedCost!: number;

  @ApiPropertyOptional({
    example: 1200.0,
    description: 'Actual billed cost for this stage (defaults to contractedCost)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'actualCost must be a valid number' })
  @Min(0, { message: 'actualCost cannot be negative' })
  actualCost?: number;

  @ApiPropertyOptional({
    example: 'USD',
    default: 'USD',
    description: 'Currency code',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    enum: StageStatus,
    default: StageStatus.PENDING,
    description: 'Freight audit status for this stage',
  })
  @IsOptional()
  @IsEnum(StageStatus, { message: 'status must be a valid StageStatus enum value' })
  status?: StageStatus;

  @ApiPropertyOptional({
    example: 'Export documentation and container drayage verified.',
    description: 'Audit or operational notes for this stage',
  })
  @IsOptional()
  @IsString()
  auditNotes?: string;
}

export class CreateShipmentDto {
  @ApiPropertyOptional({
    example: 'CP-2026-X9810',
    description: 'Tracking number (auto-generated e.g. CP-123456 if omitted)',
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({
    example: 'Shanghai Port, CN',
    description: 'Origin port or facility description',
  })
  @IsString()
  @IsNotEmpty({ message: 'Origin is required' })
  origin!: string;

  @ApiProperty({
    example: 'Los Angeles Gateway, US',
    description: 'Destination port or facility description',
  })
  @IsString()
  @IsNotEmpty({ message: 'Destination is required' })
  destination!: string;

  @ApiProperty({
    example: 'OceanBridge Global',
    description: 'Carrier or logistics freight forwarder name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Carrier name is required' })
  carrierName!: string;

  @ApiProperty({
    example: '2026-10-25T12:00:00.000Z',
    description: 'Estimated Time of Arrival (ISO 8601 date string)',
  })
  @IsISO8601({}, { message: 'eta must be a valid ISO 8601 date string' })
  eta!: string;

  @ApiPropertyOptional({
    type: () => [CreateFreightStageDto],
    description: 'Optional stages array with contracted costs. Defaults to 5 standard stages if omitted.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFreightStageDto)
  stages?: CreateFreightStageDto[];
}
