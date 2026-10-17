import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShipmentsService } from './shipments.service';
import {
  CreateNotePayload,
  CreateShipmentPayload,
  NoteTreeNode,
  PaginatedShipments,
} from '../models/shipment.model';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ShipmentsService,
      ],
    });
    service = TestBed.inject(ShipmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getShipments', () => {
    it('should fetch shipments from API and unwrap { data } envelope', () => {
      const mockApiData = {
        items: [
          {
            id: 'sh-101',
            trackingNumber: 'CP-2026-TEST1',
            origin: 'Tokyo',
            destination: 'Los Angeles',
            carrierName: 'ONE',
            currentStatus: 'IN_TRANSIT',
            eta: '2026-10-30T00:00:00Z',
            _count: { alerts: 2 },
            stages: [{}, {}, {}, {}, {}],
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      let result: PaginatedShipments | undefined;
      service.getShipments({ page: 1 }).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments?page=1');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockApiData });

      expect(result).toBeDefined();
      expect(result?.items.length).toBe(1);
      expect(result?.items[0].trackingNumber).toBe('CP-2026-TEST1');
      expect(result?.items[0].status).toBe('IN_TRANSIT');
      expect(result?.items[0].alertsCount).toBe(2);
      expect(result?.items[0].stagesCount).toBe(5);
    });

    it('should gracefully fallback to demo shipments when API call fails', () => {
      let result: PaginatedShipments | undefined;
      service.getShipments().subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(result).toBeDefined();
      expect(result?.items.length).toBeGreaterThan(0);
      expect(result?.items.some((s) => s.trackingNumber === 'CP-2026-X9810')).toBe(true);
    });

    it('should filter demo fallback shipments when search query is provided', () => {
      let result: PaginatedShipments | undefined;
      service.getShipments({ search: 'Frankfurt' }).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments?search=Frankfurt');
      req.flush('Offline', { status: 503, statusText: 'Service Unavailable' });

      expect(result).toBeDefined();
      expect(result?.items.length).toBe(1);
      expect(result?.items[0].trackingNumber).toBe('CP-2026-A1092');
    });
  });

  describe('getShipment', () => {
    it('should call GET /api/shipments/:id and unwrap response', () => {
      const mockShipment = {
        id: 'shipment-x9810',
        trackingNumber: 'CP-2026-X9810',
        origin: 'Shanghai',
      };

      let result: any;
      service.getShipment('shipment-x9810').subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments/shipment-x9810');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockShipment });

      expect(result).toEqual(mockShipment);
    });

    it('should fallback to matching in-memory demo shipment on error', () => {
      let result: any;
      service.getShipment('shipment-x9810').subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments/shipment-x9810');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe('CP-2026-X9810');
    });
  });

  describe('createShipment', () => {
    it('should post new shipment payload to API and unwrap response', () => {
      const payload: CreateShipmentPayload = {
        trackingNumber: 'CP-2026-N9999',
        origin: 'Busan (KRPUS)',
        destination: 'Long Beach (USLGB)',
        carrierName: 'HMM Hyundai',
      };

      let result: any;
      service.createShipment(payload).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.trackingNumber).toBe('CP-2026-N9999');
      req.flush({
        data: {
          id: 'sh-new-1',
          ...payload,
          status: 'PENDING',
          estimatedDelivery: '2026-11-01T00:00:00Z',
          alertsCount: 0,
          stagesCount: 5,
        },
      });

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe('CP-2026-N9999');
    });

    it('should fallback to local creation when API fails and add to demo store', () => {
      const payload: CreateShipmentPayload = {
        trackingNumber: 'CP-2026-FALLBACK',
        origin: 'Veracruz',
        destination: 'Altamira',
        carrierName: 'Transportes Mexicanos',
      };

      let result: any;
      service.createShipment(payload).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/shipments');
      req.flush('Unavailable', { status: 503, statusText: 'Unavailable' });

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe('CP-2026-FALLBACK');
      expect(result.stagesCount).toBe(5);
    });
  });

  describe('3-Level Notes Tree', () => {
    it('should fetch notes tree from /api/collaboration/shipment/:id/tree and unwrap', () => {
      const mockTree: NoteTreeNode[] = [
        {
          id: 'note-1',
          shipmentId: 'shipment-x9810',
          authorId: 'auth-1',
          author: {
            id: 'auth-1',
            firstName: 'Ana',
            lastName: 'Gomez',
            email: 'ana@cargopulse.io',
            role: 'DISPATCHER',
          },
          parentId: null,
          content: 'Level 1 note',
          attachmentUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          replies: [],
        },
      ];

      let result: NoteTreeNode[] | undefined;
      service.getNotesTree('shipment-x9810').subscribe((tree) => {
        result = tree;
      });

      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockTree });

      expect(result).toEqual(mockTree);
    });

    it('should provide fallback 3-level tree containing Master B/L, House B/L, and SKU Item when API fails for shipment-x9810', () => {
      let result: NoteTreeNode[] | undefined;
      service.getNotesTree('shipment-x9810').subscribe((tree) => {
        result = tree;
      });

      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree');
      req.flush('Error', { status: 500, statusText: 'Error' });

      expect(result).toBeDefined();
      expect(result?.length).toBeGreaterThanOrEqual(1);

      // Level 1 Root Note
      const rootNote = result![0];
      expect(rootNote.parentId).toBeNull();
      expect(rootNote.replies.length).toBeGreaterThanOrEqual(1);

      // Level 2 House B/L Note
      const level2Note = rootNote.replies[0];
      expect(level2Note.parentId).toBe(rootNote.id);
      expect(level2Note.replies.length).toBeGreaterThanOrEqual(1);

      // Level 3 SKU Cargo Item Note
      const level3Note = level2Note.replies[0];
      expect(level3Note.parentId).toBe(level2Note.id);
      expect(level3Note.replies.length).toBe(0); // Max depth strictly enforced
    });

    it('should maintain isolated notes tree per shipment and return empty tree [] for shipment without notes', () => {
      let mxusTree: NoteTreeNode[] | undefined;
      service.getNotesTree('shipment-mxus-002').subscribe((tree) => {
        mxusTree = tree;
      });
      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-002/tree');
      req.flush({ data: [] });

      expect(mxusTree).toEqual([]);

      // shipment-x9810 still has its own 3-level demo notes
      let x9810Tree: NoteTreeNode[] | undefined;
      service.getNotesTree('shipment-x9810').subscribe((tree) => {
        x9810Tree = tree;
      });
      const req2 = httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree');
      req2.flush('Offline', { status: 503, statusText: 'Offline' });

      expect(x9810Tree).toBeDefined();
      expect(x9810Tree!.length).toBeGreaterThan(0);
      expect(x9810Tree![0].content).toContain('MSC OSCAR');
    });

    it('should return empty tree [] when API returns empty array or fails for a shipment with no notes', () => {
      let result: NoteTreeNode[] | undefined;
      service.getNotesTree('shipment-mxus-001').subscribe((tree) => {
        result = tree;
      });
      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-001/tree');
      req.flush('Error', { status: 500, statusText: 'Error' });

      expect(result).toEqual([]);
    });

    it('adding a note to shipment-mxus-002 does NOT add it to shipment-x9810', () => {
      const newNote = {
        id: 'note-mxus-1',
        shipmentId: 'shipment-mxus-002',
        authorId: 'usr-ops',
        author: {
          id: 'usr-ops',
          firstName: 'Carlos',
          lastName: 'Mendez',
          email: 'carlos@cargopulse.io',
          role: 'OPERATIONS_COORDINATOR',
        },
        parentId: null,
        content: 'Customs cleared at Nuevo Laredo',
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      };

      service.createNote('shipment-mxus-002', { content: 'Customs cleared at Nuevo Laredo', parentId: null }).subscribe();
      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-002/notes');
      req.flush({ data: newNote });

      // Verify shipment-mxus-002 has it
      let mxusTree: NoteTreeNode[] = [];
      service.getNotesTree('shipment-mxus-002').subscribe((t) => (mxusTree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-002/tree').flush('Offline', { status: 503, statusText: 'Offline' });
      expect(mxusTree.length).toBe(1);
      expect(mxusTree[0].content).toBe('Customs cleared at Nuevo Laredo');

      // Verify shipment-x9810 does NOT have it
      let x9810Tree: NoteTreeNode[] = [];
      service.getNotesTree('shipment-x9810').subscribe((t) => (x9810Tree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree').flush('Offline', { status: 503, statusText: 'Offline' });
      expect(x9810Tree.some((n) => n.content === 'Customs cleared at Nuevo Laredo')).toBe(false);
    });

    it('replying to Level 1 and Level 2 notes works within the same shipment tree', () => {
      let tree: NoteTreeNode[] = [];
      service.getNotesTree('shipment-x9810').subscribe((t) => (tree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree').flush('Offline', { status: 503, statusText: 'Offline' });

      const l1 = tree[0];
      const l1Id = l1.id;
      const initialL1RepliesCount = l1.replies.length;

      // Reply to Level 1
      const createdL2 = {
        id: 'new-l2-reply',
        shipmentId: 'shipment-x9810',
        authorId: 'usr-ops',
        author: { id: 'usr-ops', firstName: 'Elena', lastName: 'Vargas', email: 'elena@cargopulse.io', role: 'CARRIER_OPS' },
        parentId: l1Id,
        content: 'New reply to Level 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      };

      service.createNote('shipment-x9810', { content: 'New reply to Level 1', parentId: l1Id }).subscribe();
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/notes').flush({ data: createdL2 });

      // Check Level 1 now has new reply
      service.getNotesTree('shipment-x9810').subscribe((t) => (tree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree').flush('Offline', { status: 503, statusText: 'Offline' });
      const updatedL1 = tree.find((n) => n.id === l1Id)!;
      expect(updatedL1.replies.length).toBe(initialL1RepliesCount + 1);

      // Reply to Level 2
      const createdL3 = {
        id: 'new-l3-reply',
        shipmentId: 'shipment-x9810',
        authorId: 'usr-qa',
        author: { id: 'usr-qa', firstName: 'Sofia', lastName: 'Reyes', email: 'sofia@cargopulse.io', role: 'QUALITY_INSPECTOR' },
        parentId: 'new-l2-reply',
        content: 'New reply to Level 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      };

      service.createNote('shipment-x9810', { content: 'New reply to Level 2', parentId: 'new-l2-reply' }).subscribe();
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/notes').flush({ data: createdL3 });

      // Check Level 2 now has Level 3 reply
      service.getNotesTree('shipment-x9810').subscribe((t) => (tree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/tree').flush('Offline', { status: 503, statusText: 'Offline' });
      const currentL1 = tree.find((n) => n.id === l1Id)!;
      const currentL2 = currentL1.replies.find((r) => r.id === 'new-l2-reply')!;
      expect(currentL2.replies.length).toBe(1);
      expect(currentL2.replies[0].content).toBe('New reply to Level 2');
    });

    it('should propagate error and not insert broken note when API fails on createNote', () => {
      let errorOccurred = false;
      service.createNote('shipment-mxus-002', { content: 'Should fail', parentId: null }).subscribe({
        error: () => {
          errorOccurred = true;
        },
      });

      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-002/notes');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorOccurred).toBe(true);

      // Tree should still be empty
      let tree: NoteTreeNode[] = [];
      service.getNotesTree('shipment-mxus-002').subscribe((t) => (tree = t));
      httpMock.expectOne('/api/collaboration/shipment/shipment-mxus-002/tree').flush('Offline', { status: 503, statusText: 'Offline' });
      expect(tree).toEqual([]);
    });
  });
});
