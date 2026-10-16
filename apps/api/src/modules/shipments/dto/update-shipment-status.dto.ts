import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateShipmentStatusDto {
  @ApiProperty({
    enum: ShipmentStatus,
    example: ShipmentStatus.DELIVERED,
    description: 'Updated shipment status',
  })
  @IsEnum(ShipmentStatus, {
    message: 'currentStatus must be a valid ShipmentStatus enum value',
  })
  currentStatus!: ShipmentStatus;
}
