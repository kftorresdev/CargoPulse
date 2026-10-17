import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
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
    example: 'note-1792207398579',
    description: 'Parent note ID for threaded discussions (optional)',
  })
  @IsOptional()
  @IsString({ message: 'parentId must be a string' })
  parentId?: string;

  @ApiPropertyOptional({
    example: 'https://documents.cargopulse.internal/docs/customs-release.pdf',
    description: 'Optional URL or reference to an attached document',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
