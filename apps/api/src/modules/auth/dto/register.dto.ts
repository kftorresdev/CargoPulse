import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'operator@cargopulse.com',
    description: 'Corporate email address',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Minimum 8 characters password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({
    example: 'Carlos',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({
    example: 'Mendoza',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.LOGISTICS_OPERATOR,
    description: 'User role in CargoPulse platform',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be ADMIN, LOGISTICS_OPERATOR, or FREIGHT_AUDITOR' })
  role?: Role;
}
