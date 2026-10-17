import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ControlTowerService } from './control-tower.service.js';
import { TopologyDataDto } from './dto/topology.dto.js';

@ApiTags('Control Tower')
@Controller('control-tower')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ControlTowerController {
  constructor(private readonly controlTowerService: ControlTowerService) {}

  @Get('topology')
  @ApiOperation({
    summary:
      'Get supply chain network topology with corridor nodes, links, and shipment summaries',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complete cross-border supply chain network topology',
    type: TopologyDataDto,
  })
  getTopology(): TopologyDataDto {
    return this.controlTowerService.getTopology();
  }
}
