import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PhotoUploadDto {
  @ApiProperty({
    example: 'photo_1.jpg',
    description: 'Name of the photo file',
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME content type of the photo',
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,...',
    description: 'Base64 encoded content or photo path',
  })
  @IsString()
  @IsNotEmpty()
  base64Content!: string;
}

export class CreateInspectionDto {
  @ApiProperty({
    example: 'insp-550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique inspection identifier from mobile client',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    example: 'CP-2026-X9810',
    description: 'Shipment UUID or tracking number associated with the inspection',
  })
  @IsString()
  @IsNotEmpty()
  shipmentId!: string;

  @ApiProperty({
    example: 'GOOD',
    description: 'Condition of the container (e.g. GOOD, DAMAGED, SUSPICIOUS)',
  })
  @IsString()
  @IsNotEmpty()
  containerCondition!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the container seal is intact',
  })
  @IsBoolean()
  sealIntact!: boolean;

  @ApiPropertyOptional({
    example: 'SEAL-MX-98442',
    description: 'Declared seal number from bill of lading / manifest',
  })
  @IsOptional()
  @IsString()
  sealNumberDeclared?: string;

  @ApiPropertyOptional({
    example: 'SEAL-MX-98442',
    description: 'Actual physical seal number found on container',
  })
  @IsOptional()
  @IsString()
  sealNumberActual?: string;

  @ApiProperty({
    example: false,
    description: 'Whether there is a mismatch between declared and actual seal numbers',
  })
  @IsBoolean()
  sealMismatch!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether damages were detected and reported',
  })
  @IsBoolean()
  damagesReported!: boolean;

  @ApiPropertyOptional({
    example: 'Minor dent on lower left door latch',
    description: 'Detailed description of damages found during inspection',
  })
  @IsOptional()
  @IsString()
  damagesDescription?: string | null;

  @ApiPropertyOptional({
    type: [PhotoUploadDto],
    description: 'List of photographic evidence captured during inspection',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoUploadDto)
  photos?: PhotoUploadDto[];

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Carrier / driver touch signature in Base64 format',
  })
  @IsString()
  @IsNotEmpty()
  signatureBase64!: string;

  @ApiProperty({
    example: 'Carlos Mendoza',
    description: 'Full name of carrier or inspector who signed the inspection',
  })
  @IsString()
  @IsNotEmpty()
  signerName!: string;

  @ApiPropertyOptional({
    example: '25.6866,-100.3161',
    description: 'GPS coordinates of the inspection location',
  })
  @IsOptional()
  @IsString()
  gpsCoordinates?: string | null;

  @ApiPropertyOptional({
    example: '2026-10-18T06:00:00.000Z',
    description: 'Timestamp when inspection was performed',
  })
  @IsOptional()
  @IsString()
  inspectedAt?: string;
}

export interface InspectionSyncResult {
  id: string;
  shipmentId: string;
  status: string;
  syncedAt: Date;
  alertCreated?: boolean;
}
