import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ShipmentsService } from './shipments.service.js';
import {
  CreateShipmentDto,
  ShipmentQueryDto,
  UpdateShipmentStatusDto,
} from './dto/index.js';

@ApiTags('Shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new shipment with 5 default freight stages',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shipment successfully created with stages',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input payload',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.shipmentsService.create(dto, userId);
  }

  @Get('/')
  @ApiOperation({
    summary: 'List shipments with pagination, filtering, and stage counts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated shipments list returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async findAll(@Query() query: ShipmentQueryDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get shipment by ID with stages, alerts, and discussion notes',
  })
  @ApiParam({
    name: 'id',
    description: 'Shipment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shipment details returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch('/:id/status')
  @ApiOperation({
    summary:
      'Update shipment current status and set actual delivery date when DELIVERED',
  })
  @ApiParam({
    name: 'id',
    description: 'Shipment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shipment status updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentsService.updateStatus(id, dto);
  }
}
