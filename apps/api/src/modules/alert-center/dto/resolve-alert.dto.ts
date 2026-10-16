import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResolveAlertDto {
  @ApiProperty({
    example: 'Container inspected and released by customs; demurrage waived by terminal operator.',
    description: 'Detailed explanation of how the operational alert was resolved (minimum 10 characters)',
    minLength: 10,
  })
  @IsString({ message: 'resolutionNotes must be a string' })
  @IsNotEmpty({ message: 'resolutionNotes is required' })
  @MinLength(10, {
    message: 'Resolution notes must be at least 10 characters long',
  })
  resolutionNotes!: string;
}
