import { describe, it, expect, beforeEach } from 'vitest';
import { ControlTowerController } from './control-tower.controller.js';
import { ControlTowerService } from './control-tower.service.js';

describe('ControlTowerController', () => {
  let controller: ControlTowerController;
  let service: ControlTowerService;

  beforeEach(() => {
    service = new ControlTowerService();
    controller = new ControlTowerController(service);
  });

  describe('getTopology', () => {
    it('should return supply chain topology with nodes, links, and shipments', () => {
      const result = controller.getTopology();

      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(6);
      expect(result.links).toHaveLength(8);
      expect(result.shipments).toHaveLength(6);
    });
  });
});
