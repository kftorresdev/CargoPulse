import { describe, it, expect, beforeEach } from 'vitest';
import { ControlTowerService } from './control-tower.service.js';

describe('ControlTowerService', () => {
  let service: ControlTowerService;

  beforeEach(() => {
    service = new ControlTowerService();
  });

  describe('getTopology', () => {
    it('should return topology containing 6 nodes, 8 links, and shipments', () => {
      const topology = service.getTopology();

      expect(topology).toBeDefined();
      expect(topology.nodes).toHaveLength(6);
      expect(topology.links).toHaveLength(8);
      expect(topology.shipments).toHaveLength(6);
    });

    it('should include all required cross-border supply chain nodes', () => {
      const { nodes } = service.getTopology();
      const nodeIds = nodes.map((n) => n.id);

      expect(nodeIds).toContain('monterrey-assembly');
      expect(nodeIds).toContain('guadalajara-hub');
      expect(nodeIds).toContain('nuevo-laredo-customs');
      expect(nodeIds).toContain('port-of-houston');
      expect(nodeIds).toContain('dfw-fulfillment');
      expect(nodeIds).toContain('chicago-depot');

      const nuevoLaredo = nodes.find((n) => n.id === 'nuevo-laredo-customs');
      expect(nuevoLaredo?.type).toBe('CUSTOMS_BORDER');
      expect(nuevoLaredo?.status).toBe('CONGESTED');
    });

    it('should have valid links between defined nodes', () => {
      const { nodes, links } = service.getTopology();
      const nodeIds = new Set(nodes.map((n) => n.id));

      for (const link of links) {
        expect(nodeIds.has(link.source)).toBe(true);
        expect(nodeIds.has(link.target)).toBe(true);
        expect(link.transitDays).toBeGreaterThan(0);
        expect(['ROAD', 'RAIL', 'OCEAN', 'AIR']).toContain(link.mode);
      }
    });

    it('should have active shipments with route details', () => {
      const { shipments } = service.getTopology();

      for (const shp of shipments) {
        expect(shp.trackingNumber).toMatch(/^CP-MXUS-2026-\d{3}$/);
        expect(shp.origin).toBeDefined();
        expect(shp.destination).toBeDefined();
        expect(shp.carrierName).toBeDefined();
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(shp.delayRisk);
        expect(shp.routeNodeIds?.length).toBeGreaterThanOrEqual(2);
        expect(shp.routeLinkIds?.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
