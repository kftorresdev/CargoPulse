import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Cargo inspection cleared at customs terminal.',
    description: 'Note or reply content (minimum 2 characters)',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(2, { message: 'Content must be at least 2 characters long' })
  content!: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Parent note UUID for threaded discussions (optional)',
  })
  @IsOptional()
  @IsUUID('all', { message: 'parentId must be a valid UUID' })
  parentId?: string;

  @ApiPropertyOptional({
    example: 'https://documents.cargopulse.internal/docs/customs-release.pdf',
    description: 'Optional URL or reference to an attached document',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
