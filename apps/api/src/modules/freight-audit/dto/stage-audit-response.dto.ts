import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageStatus, StageType } from '@prisma/client';

export class FreightStageResponseDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Unique freight stage UUID',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Associated shipment UUID',
  })
  shipmentId!: string;

  @ApiProperty({
    enum: StageType,
    example: StageType.TRANSIT_1,
    description: 'Type of freight stage',
  })
  stageType!: StageType;

  @ApiProperty({
    example: 2,
    description: 'Sequential order of this leg/stage (1 to 5)',
  })
  stageOrder!: number;

  @ApiProperty({
    example: 4500.0,
    description: 'Contracted baseline cost in USD',
  })
  contractedCost!: number;

  @ApiProperty({
    example: 4850.0,
    description: 'Actual incurred cost in USD',
  })
  actualCost!: number;

  @ApiProperty({
    example: 350.0,
    description: 'Variance in USD (actualCost - contractedCost)',
  })
  variance!: number;

  @ApiProperty({
    example: 7.78,
    description: 'Variance percentage ((variance / contractedCost) * 100)',
  })
  variancePercent!: number;

  @ApiProperty({
    example: 'USD',
    description: 'Currency code',
  })
  currency!: string;

  @ApiProperty({
    enum: StageStatus,
    example: StageStatus.DISPUTED,
    description: 'Audit status of the freight stage',
  })
  status!: StageStatus;

  @ApiPropertyOptional({
    example: 'Ocean freight bunker adjustment factor billed over agreed cap.',
    description: 'Auditor notes or discrepancy comments',
  })
  auditNotes?: string | null;

  @ApiProperty({
    example: '2026-10-16T12:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-10-16T14:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt!: Date;
}
