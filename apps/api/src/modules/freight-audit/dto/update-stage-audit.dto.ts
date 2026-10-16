import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StageStatus } from '@prisma/client';

export class UpdateStageAuditDto {
  @ApiProperty({
    example: 1250.0,
    description: 'Actual incurred cost for this freight stage in USD',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Actual cost must be a valid number' })
  @Min(0, { message: 'Actual cost must be greater than or equal to 0' })
  actualCost!: number;

  @ApiPropertyOptional({
    example: 'Detention fee verified against port terminal timestamp logs.',
    description: 'Audit justification or discrepancy notes',
  })
  @IsOptional()
  @IsString({ message: 'Audit notes must be a string' })
  auditNotes?: string;

  @ApiPropertyOptional({
    enum: StageStatus,
    example: StageStatus.APPROVED,
    description: 'Audit status override (PENDING, APPROVED, DISPUTED)',
  })
  @IsOptional()
  @IsEnum(StageStatus, {
    message: 'Status must be one of: PENDING, APPROVED, DISPUTED',
  })
  status?: StageStatus;
}
