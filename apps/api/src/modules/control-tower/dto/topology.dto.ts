import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type TopologyNodeType = 'ORIGIN' | 'CUSTOMS_BORDER' | 'DESTINATION';
export type TopologyNodeStatus = 'NORMAL' | 'DELAYED' | 'CONGESTED';
export type TransportMode = 'ROAD' | 'RAIL' | 'OCEAN' | 'AIR';
export type DelayRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export class TopologyNodeDto {
  @ApiProperty({
    example: 'monterrey-assembly',
    description: 'Unique node identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'Monterrey Assembly',
    description: 'Display label for node',
  })
  label!: string;

  @ApiProperty({
    example: 'ORIGIN',
    enum: ['ORIGIN', 'CUSTOMS_BORDER', 'DESTINATION'],
    description: 'Node category type',
  })
  type!: TopologyNodeType;

  @ApiProperty({
    example: 'Monterrey, NL, Mexico',
    description: 'Geographic location description',
  })
  location!: string;

  @ApiProperty({
    example: 3,
    description: 'Number of active shipments at/passing through this node',
  })
  activeShipmentsCount!: number;

  @ApiProperty({
    example: 'NORMAL',
    enum: ['NORMAL', 'DELAYED', 'CONGESTED'],
    description: 'Operational status',
  })
  status!: TopologyNodeStatus;

  @ApiPropertyOptional({
    example: 'Tier-1 automotive manufacturing & industrial assembly hub',
    description: 'Facility description',
  })
  description?: string;
}

export class TopologyLinkDto {
  @ApiProperty({
    example: 'link-mty-nld',
    description: 'Unique link identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'monterrey-assembly',
    description: 'Source node ID',
  })
  source!: string;

  @ApiProperty({
    example: 'nuevo-laredo-customs',
    description: 'Target node ID',
  })
  target!: string;

  @ApiProperty({
    example: 'Carretera 85D (Highway)',
    description: 'Display label for link/corridor',
  })
  label!: string;

  @ApiProperty({
    example: 1,
    description: 'Transit time in days',
  })
  transitDays!: number;

  @ApiProperty({
    example: 'ROAD',
    enum: ['ROAD', 'RAIL', 'OCEAN', 'AIR'],
    description: 'Transportation mode',
  })
  mode!: TransportMode;
}

export class ShipmentSummaryDto {
  @ApiProperty({
    example: 'SHP-1001',
    description: 'Unique shipment identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'CP-MXUS-2026-001',
    description: 'Tracking number',
  })
  trackingNumber!: string;

  @ApiProperty({
    example: 'Monterrey Assembly',
    description: 'Origin node label',
  })
  origin!: string;

  @ApiProperty({
    example: 'DFW Fulfillment',
    description: 'Destination node label',
  })
  destination!: string;

  @ApiProperty({
    example: 'TUM Logistica',
    description: 'Assigned carrier name',
  })
  carrierName!: string;

  @ApiProperty({
    example: 'IN_TRANSIT',
    description: 'Current shipment status',
  })
  status!: string;

  @ApiProperty({
    example: 'Nuevo Laredo Customs',
    description: 'Current node/stage',
  })
  currentStage!: string;

  @ApiProperty({
    example: '2026-10-18 14:00',
    description: 'Estimated time of arrival',
  })
  eta!: string;

  @ApiProperty({
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    description: 'Delay risk assessment',
  })
  delayRisk!: DelayRisk;

  @ApiPropertyOptional({
    example: ['monterrey-assembly', 'nuevo-laredo-customs', 'dfw-fulfillment'],
    type: [String],
    description: 'Ordered array of node IDs along route',
  })
  routeNodeIds?: string[];

  @ApiPropertyOptional({
    example: ['link-mty-nld', 'link-nld-dfw'],
    type: [String],
    description: 'Ordered array of link IDs along route',
  })
  routeLinkIds?: string[];
}

export class TopologyDataDto {
  @ApiProperty({
    type: [TopologyNodeDto],
    description: 'Supply chain network nodes',
  })
  nodes!: TopologyNodeDto[];

  @ApiProperty({
    type: [TopologyLinkDto],
    description: 'Corridor links between nodes',
  })
  links!: TopologyLinkDto[];

  @ApiProperty({
    type: [ShipmentSummaryDto],
    description: 'Active shipments traversing the network',
  })
  shipments!: ShipmentSummaryDto[];
}
