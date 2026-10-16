export type TopologyNodeType = 'ORIGIN' | 'CUSTOMS_BORDER' | 'DESTINATION';
export type TopologyNodeStatus = 'NORMAL' | 'DELAYED' | 'CONGESTED';
export type TransportMode = 'ROAD' | 'RAIL' | 'OCEAN' | 'AIR';
export type DelayRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TopologyNode {
  id: string;
  label: string;
  type: TopologyNodeType;
  location: string;
  activeShipmentsCount: number;
  status: TopologyNodeStatus;
  description?: string;
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  label: string;
  transitDays: number;
  mode: TransportMode;
}

export interface ShipmentSummary {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrierName: string;
  status: string;
  currentStage: string;
  eta: string;
  delayRisk: DelayRisk;
  routeNodeIds?: string[];
  routeLinkIds?: string[];
}

export interface TopologyData {
  nodes: TopologyNode[];
  links: TopologyLink[];
  shipments: ShipmentSummary[];
}

export interface ControlTowerKpis {
  activeNodes: number;
  inTransitShipments: number;
  customsHolds: number;
  onTimeRate: string;
}
