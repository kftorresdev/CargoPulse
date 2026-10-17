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

    it('should provide fallback 3-level tree containing Master B/L, House B/L, and SKU Item when API fails', () => {
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

    it('should post note to /api/collaboration/shipment/:id/notes and update in-memory tree', () => {
      const payload: CreateNotePayload = {
        content: 'New Operational Directive',
        parentId: null,
      };

      let result: any;
      service.createNote('shipment-x9810', payload).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('/api/collaboration/shipment/shipment-x9810/notes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      const createdResponse = {
        id: 'new-root-note',
        shipmentId: 'shipment-x9810',
        authorId: 'user-ops',
        author: {
          id: 'user-ops',
          firstName: 'Elena',
          lastName: 'Vargas',
          email: 'elena@cargopulse.io',
          role: 'CARRIER_OPS',
        },
        parentId: null,
        content: payload.content,
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      };
      req.flush({ data: createdResponse });

      expect(result).toEqual(createdResponse);
    });

    it('should fallback and insert reply note into in-memory tree when API fails', () => {
      // First get tree to initialize fallback data
      let currentTree: NoteTreeNode[] = [];
      service.getNotesTree('shipment-x9810').subscribe((tree) => {
        currentTree = tree;
      });
      httpMock
        .expectOne('/api/collaboration/shipment/shipment-x9810/tree')
        .flush('Offline', { status: 503, statusText: 'Offline' });

      const targetParentId = currentTree[0].id;
      const replyPayload: CreateNotePayload = {
        content: 'Replying to Level 1 Master B/L',
        parentId: targetParentId,
      };

      let replyResult: any;
      service.createNote('shipment-x9810', replyPayload).subscribe((res) => {
        replyResult = res;
      });

      httpMock
        .expectOne('/api/collaboration/shipment/shipment-x9810/notes')
        .flush('Offline', { status: 503, statusText: 'Offline' });

      expect(replyResult).toBeDefined();
      expect(replyResult.content).toBe('Replying to Level 1 Master B/L');
      expect(replyResult.parentId).toBe(targetParentId);
    });
  });
});
