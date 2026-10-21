import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { InspectionsService } from './inspections.service.js';
import {
  CreateInspectionDto,
  InspectionSyncResult,
} from './dto/create-inspection.dto.js';

@ApiTags('Inspections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload and synchronize mobile freight inspection record',
    description:
      'Receives inspection checklist, seal verification, photographic evidence, and carrier signature. Automatically generates alerts for seal discrepancies or reported damage and records an immutable collaboration note.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inspection processed and synchronized successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid inspection payload or validation failure',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async createInspection(
    @Body() dto: CreateInspectionDto,
    @CurrentUser() user?: { id?: string; email?: string },
  ): Promise<InspectionSyncResult> {
    return this.inspectionsService.createInspection(dto, user);
  }
}
