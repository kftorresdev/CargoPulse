import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AlertCenterService } from './alert-center.service.js';
import { AlertQueryDto } from './dto/alert-query.dto.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';
import { ResolveAlertDto } from './dto/resolve-alert.dto.js';
import { AlertKpisDto } from './dto/alert-kpis.dto.js';
import { AlertResponseDto } from './dto/alert-response.dto.js';

@ApiTags('Alert Center')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertCenterController {
  constructor(private readonly alertCenterService: AlertCenterService) {}

  @Get('kpis')
  @ApiOperation({
    summary: 'Get real-time Alert Center KPIs, counts, and financial impact metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alert Center aggregated KPIs and metrics',
    type: AlertKpisDto,
  })
  async getKpis(): Promise<AlertKpisDto> {
    return this.alertCenterService.getKpis();
  }

  @Get()
  @ApiOperation({
    summary: 'List alerts with optional status and severity filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of operational alerts with shipment metadata and dynamic SLA countdown',
    type: [AlertResponseDto],
  })
  async findAll(@Query() query: AlertQueryDto): Promise<AlertResponseDto[]> {
    return this.alertCenterService.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new operational shipment alert',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created operational alert',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Associated shipment does not exist',
  })
  async createAlert(@Body() dto: CreateAlertDto): Promise<AlertResponseDto> {
    return this.alertCenterService.createAlert(dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Resolve an existing operational alert with resolution notes',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique alert identifier UUID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully resolved alert with audit trail notes',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alert with specified ID does not exist',
  })
  async resolveAlert(
    @Param('id') id: string,
    @Body() dto: ResolveAlertDto,
  ): Promise<AlertResponseDto> {
    return this.alertCenterService.resolveAlert(id, dto);
  }
}
