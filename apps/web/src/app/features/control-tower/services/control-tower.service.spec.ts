import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ControlTowerService } from './control-tower.service';
import { TopologyData } from '../models/topology.model';

describe('ControlTowerService', () => {
  let service: ControlTowerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ControlTowerService
      ]
    });
    service = TestBed.inject(ControlTowerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDemoData', () => {
    it('should provide deterministic cross-border topology with 6 nodes, 8 links, and 6 shipments', () => {
      const data = service.getDemoData();

      expect(data.nodes.length).toBe(6);
      expect(data.links.length).toBe(8);
      expect(data.shipments.length).toBe(6);

      const nodeIds = data.nodes.map(n => n.id);
      expect(nodeIds).toContain('monterrey-assembly');
      expect(nodeIds).toContain('guadalajara-hub');
      expect(nodeIds).toContain('nuevo-laredo-customs');
      expect(nodeIds).toContain('port-of-houston');
      expect(nodeIds).toContain('dfw-fulfillment');
      expect(nodeIds).toContain('chicago-depot');
    });

    it('should classify node types as ORIGIN, CUSTOMS_BORDER, and DESTINATION', () => {
      const data = service.getDemoData();
      const originNodes = data.nodes.filter(n => n.type === 'ORIGIN');
      const customsNodes = data.nodes.filter(n => n.type === 'CUSTOMS_BORDER');
      const destNodes = data.nodes.filter(n => n.type === 'DESTINATION');

      expect(originNodes.length).toBe(2);
      expect(customsNodes.length).toBe(2);
      expect(destNodes.length).toBe(2);
    });

    it('should cover ROAD, RAIL, OCEAN, and AIR transport modes across links', () => {
      const data = service.getDemoData();
      const modes = new Set(data.links.map(l => l.mode));

      expect(modes.has('ROAD')).toBe(true);
      expect(modes.has('RAIL')).toBe(true);
      expect(modes.has('OCEAN')).toBe(true);
      expect(modes.has('AIR')).toBe(true);
    });
  });

  describe('getTopologyData with HTTP and fallback', () => {
    it('should return API response data when HTTP call succeeds', () => {
      const mockCustomData: TopologyData = {
        nodes: [
          {
            id: 'custom-node',
            label: 'Custom Node',
            type: 'ORIGIN',
            location: 'Mexico',
            activeShipmentsCount: 1,
            status: 'NORMAL'
          }
        ],
        links: [],
        shipments: []
      };

      let result: TopologyData | undefined;
      service.getTopologyData().subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne('/api/control-tower/topology');
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomData);

      expect(result).toEqual(mockCustomData);
    });

    it('should gracefully fallback to demo data when HTTP call fails with 404/500', () => {
      let result: TopologyData | undefined;
      service.getTopologyData().subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne('/api/control-tower/topology');
      req.flush('Endpoint unseeded', { status: 404, statusText: 'Not Found' });

      expect(result).toBeDefined();
      expect(result?.nodes.length).toBe(6);
      expect(result?.shipments.length).toBe(6);
    });
  });

  describe('Sub-selectors', () => {
    it('should return nodes via getNodes()', () => {
      let nodesCount = 0;
      service.getNodes().subscribe(nodes => {
        nodesCount = nodes.length;
      });

      const req = httpMock.expectOne('/api/control-tower/topology');
      req.flush(service.getDemoData());

      expect(nodesCount).toBe(6);
    });

    it('should return links via getLinks()', () => {
      let linksCount = 0;
      service.getLinks().subscribe(links => {
        linksCount = links.length;
      });

      const req = httpMock.expectOne('/api/control-tower/topology');
      req.flush(service.getDemoData());

      expect(linksCount).toBe(8);
    });

    it('should return shipments via getShipments()', () => {
      let shipmentsCount = 0;
      service.getShipments().subscribe(shipments => {
        shipmentsCount = shipments.length;
      });

      const req = httpMock.expectOne('/api/control-tower/topology');
      req.flush(service.getDemoData());

      expect(shipmentsCount).toBe(6);
    });
  });
});
