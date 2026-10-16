import { ApiProperty } from '@nestjs/swagger';
import { StageType } from '@prisma/client';

export class StageBreakdownDto {
  @ApiProperty({
    enum: StageType,
    example: StageType.ORIGIN_HANDLING,
    description: 'Stage type categorization',
  })
  stageType!: StageType;

  @ApiProperty({
    example: 3,
    description: 'Total number of stages of this type',
  })
  stageCount!: number;

  @ApiProperty({
    example: 3600.0,
    description: 'Aggregated contracted cost in USD',
  })
  totalContractedCost!: number;

  @ApiProperty({
    example: 3850.0,
    description: 'Aggregated actual cost in USD',
  })
  totalActualCost!: number;

  @ApiProperty({
    example: 250.0,
    description: 'Aggregated financial variance (actual - contracted) in USD',
  })
  totalVariance!: number;

  @ApiProperty({
    example: 6.94,
    description: 'Aggregated variance percentage ((variance / contracted) * 100)',
  })
  variancePercentage!: number;

  @ApiProperty({
    example: 1,
    description: 'Total disputed stages count for this stage type',
  })
  disputedStagesCount!: number;
}

export class FreightAuditSummaryDto {
  @ApiProperty({
    example: 31750.0,
    description: 'Total contracted cost across all freight stages in USD',
  })
  totalContractedCost!: number;

  @ApiProperty({
    example: 33850.0,
    description: 'Total actual cost across all freight stages in USD',
  })
  totalActualCost!: number;

  @ApiProperty({
    example: 2100.0,
    description: 'Total financial variance across all freight stages in USD',
  })
  totalVariance!: number;

  @ApiProperty({
    example: 6.61,
    description: 'Overall variance percentage across all stages',
  })
  variancePercentage!: number;

  @ApiProperty({
    example: 2,
    description: 'Total number of stages currently in DISPUTED status',
  })
  disputedStagesCount!: number;

  @ApiProperty({
    type: [StageBreakdownDto],
    description: 'Breakdown of financial metrics aggregated by stage type',
  })
  breakdown!: StageBreakdownDto[];
}
