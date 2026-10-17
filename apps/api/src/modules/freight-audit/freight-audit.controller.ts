import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FreightAuditService } from './freight-audit.service.js';
import { UpdateStageAuditDto } from './dto/update-stage-audit.dto.js';
import { FreightAuditSummaryDto } from './dto/freight-audit-summary.dto.js';
import { FreightStageResponseDto } from './dto/stage-audit-response.dto.js';

@ApiTags('Freight Audit')
@Controller('freight-audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FreightAuditController {
  constructor(private readonly freightAuditService: FreightAuditService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get aggregated financial audit metrics and stage breakdown',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aggregated freight audit summary and breakdown by stage type',
    type: FreightAuditSummaryDto,
  })
  async getSummary(): Promise<FreightAuditSummaryDto> {
    return this.freightAuditService.getSummary();
  }

  @Get('export/excel')
  @ApiOperation({
    summary: 'Export freight cost audit report to formatted Excel (.xlsx)',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code for report labels and stage translations (es or en)',
    enum: ['es', 'en'],
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel spreadsheet binary attachment',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportToExcel(
    @Res() res: Response,
    @Query('lang') lang?: string,
  ): Promise<void> {
    await this.freightAuditService.exportToExcel(res, lang);
  }

  @Get('shipment/:shipmentId')
  @ApiOperation({
    summary: 'Get 5-stage freight cost audit details for a specific shipment',
  })
  @ApiParam({
    name: 'shipmentId',
    description: 'Unique shipment identifier UUID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordered array of 5 freight stages with cost and variance details',
    type: [FreightStageResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment with specified ID does not exist',
  })
  async getShipmentAudit(
    @Param('shipmentId') shipmentId: string,
  ): Promise<FreightStageResponseDto[]> {
    return this.freightAuditService.getShipmentAudit(shipmentId);
  }

  @Patch('stage/:stageId')
  @ApiOperation({
    summary: 'Update freight stage actual cost and audit status with auto-variance rules',
  })
  @ApiParam({
    name: 'stageId',
    description: 'Unique freight stage identifier UUID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated freight stage with recalculated variance',
    type: FreightStageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Freight stage with specified ID does not exist',
  })
  async updateStageAudit(
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageAuditDto,
  ): Promise<FreightStageResponseDto> {
    return this.freightAuditService.updateStageAudit(stageId, dto);
  }
}
