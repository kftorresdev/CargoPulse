import { ApiProperty } from '@nestjs/swagger';

export class AlertKpisDto {
  @ApiProperty({
    example: 12,
    description: 'Total number of alerts across all statuses',
  })
  totalAlerts!: number;

  @ApiProperty({
    example: 3,
    description: 'Number of alerts with CRITICAL severity',
  })
  criticalCount!: number;

  @ApiProperty({
    example: 4,
    description: 'Number of alerts with HIGH severity',
  })
  highCount!: number;

  @ApiProperty({
    example: 3,
    description: 'Number of alerts with MEDIUM severity',
  })
  mediumCount!: number;

  @ApiProperty({
    example: 2,
    description: 'Number of alerts with LOW severity',
  })
  lowCount!: number;

  @ApiProperty({
    example: 5,
    description: 'Number of alerts currently in OPEN status',
  })
  openCount!: number;

  @ApiProperty({
    example: 7,
    description: 'Number of alerts in RESOLVED status',
  })
  resolvedCount!: number;

  @ApiProperty({
    example: 4250.0,
    description: 'Aggregated financial impact in USD for all active (OPEN / IN_PROGRESS) alerts',
  })
  totalFinancialImpactUsd!: number;

  @ApiProperty({
    example: 1,
    description: 'Total number of alerts that have breached their resolution SLA deadline',
  })
  slaBreachedCount!: number;
}
