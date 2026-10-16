import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { CollaborationService } from './collaboration.service.js';
import { CreateNoteDto } from './dto/index.js';

@ApiTags('Collaboration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('shipment/:shipmentId/tree')
  @ApiOperation({
    summary: 'Get 3-level hierarchical discussion tree for a shipment',
  })
  @ApiParam({
    name: 'shipmentId',
    description: 'Shipment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '3-level hierarchical notes tree returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async getNotesTree(@Param('shipmentId') shipmentId: string) {
    return this.collaborationService.getNotesTree(shipmentId);
  }

  @Post('shipment/:shipmentId/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new note or threaded reply up to 3 levels deep',
  })
  @ApiParam({
    name: 'shipmentId',
    description: 'Shipment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note successfully created and linked to author',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid parent note, parent not found, or maximum discussion depth (3 levels) exceeded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer authentication token',
  })
  async createNote(
    @Param('shipmentId') shipmentId: string,
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.collaborationService.createNote(shipmentId, authorId, dto);
  }
}
