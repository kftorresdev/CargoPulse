import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatus } from '@prisma/client';

export class ShipmentQueryDto {
  @ApiPropertyOptional({
    enum: ShipmentStatus,
    description: 'Filter by current shipment status',
  })
  @IsOptional()
  @IsEnum(ShipmentStatus, {
    message: 'status must be a valid ShipmentStatus enum value',
  })
  status?: ShipmentStatus;

  @ApiPropertyOptional({
    example: 'Shanghai',
    description: 'Filter by origin location (case-insensitive partial match)',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    example: 'Los Angeles',
    description: 'Filter by destination location (case-insensitive partial match)',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    example: 'OceanBridge',
    description: 'Search across trackingNumber, origin, destination, and carrierName',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number for pagination',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Number of items per page (maximum 100)',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit: number = 10;
}
