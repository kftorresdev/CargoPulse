import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AlertSeverity, AlertStatus } from '@prisma/client';

export class AlertQueryDto {
  @ApiPropertyOptional({
    enum: AlertStatus,
    example: AlertStatus.OPEN,
    description: 'Filter alerts by lifecycle status (OPEN, IN_PROGRESS, RESOLVED)',
  })
  @IsOptional()
  @IsEnum(AlertStatus, {
    message: 'status must be one of: OPEN, IN_PROGRESS, RESOLVED',
  })
  status?: AlertStatus;

  @ApiPropertyOptional({
    enum: AlertSeverity,
    example: AlertSeverity.CRITICAL,
    description: 'Filter alerts by severity level (LOW, MEDIUM, HIGH, CRITICAL)',
  })
  @IsOptional()
  @IsEnum(AlertSeverity, {
    message: 'severity must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  severity?: AlertSeverity;
}
