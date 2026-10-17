import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CreateNotePayload,
  CreateShipmentPayload,
  NoteTreeNode,
  PaginatedShipments,
  ShipmentItem,
} from '../models/shipment.model';

@Injectable({
  providedIn: 'root',
})
export class ShipmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/shipments';
  private readonly collabUrl = '/api/collaboration';

  // In-memory demo shipments seed
  private demoShipments: ShipmentItem[] = [
    {
      id: 'shipment-x9810',
      trackingNumber: 'CP-2026-X9810',
      origin: 'Shanghai Yangshan (CNSHA)',
      destination: 'Los Angeles Pier 400 (USLAX)',
      carrierName: 'Ocean Network Express (ONE)',
      status: 'IN_TRANSIT',
      estimatedDelivery: '2026-10-24T18:00:00.000Z',
      alertsCount: 2,
      stagesCount: 5,
    },
    {
      id: 'shipment-a1092',
      trackingNumber: 'CP-2026-A1092',
      origin: 'Frankfurt CargoCity (EDDF)',
      destination: "Chicago O'Hare Intl (KORD)",
      carrierName: 'Lufthansa Cargo AWB',
      status: 'CUSTOMS_HOLD',
      estimatedDelivery: '2026-10-19T14:30:00.000Z',
      alertsCount: 1,
      stagesCount: 5,
    },
    {
      id: 'shipment-r4419',
      trackingNumber: 'CP-2026-R4419',
      origin: 'Rotterdam Maasvlakte (NLRTM)',
      destination: 'Munich Riem Terminal (DEMUC)',
      carrierName: 'DB Cargo Rail Logistics',
      status: 'DELIVERED',
      estimatedDelivery: '2026-10-15T09:15:00.000Z',
      alertsCount: 0,
      stagesCount: 5,
    },
    {
      id: 'shipment-m5520',
      trackingNumber: 'CP-2026-M5520',
      origin: 'Shenzhen Yantian (CNSZX)',
      destination: 'Manzanillo Terminal (MXZLO)',
      carrierName: 'Maersk Line Intermodal',
      status: 'IN_TRANSIT',
      estimatedDelivery: '2026-10-28T12:00:00.000Z',
      alertsCount: 0,
      stagesCount: 5,
    },
    {
      id: 'shipment-k7712',
      trackingNumber: 'CP-2026-K7712',
      origin: 'Tokyo Narita (RJAA)',
      destination: 'Dallas/Fort Worth Hub (KDFW)',
      carrierName: 'Polar Air Cargo Express',
      status: 'PENDING',
      estimatedDelivery: '2026-10-26T22:00:00.000Z',
      alertsCount: 3,
      stagesCount: 5,
    },
  ];

  // In-memory demo 3-level tree storage per shipment
  private demoTreesByShipment: Record<string, NoteTreeNode[]> = {};

  constructor() {
    this.seedDefaultTrees();
  }

  /**
   * Retrieves paginated shipments with optional search and filters.
   * Unwraps `res?.data ?? res` and falls back gracefully to in-memory demo shipments.
   */
  getShipments(query?: any): Observable<PaginatedShipments> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
          params = params.set(key, String(query[key]));
        }
      });
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map((res) => {
        const payload = res?.data ?? res;
        if (payload && Array.isArray(payload.items)) {
          const normalizedItems: ShipmentItem[] = payload.items.map((item: any) =>
            this.normalizeShipmentItem(item)
          );
          return {
            items: normalizedItems,
            meta: payload.meta ?? {
              total: normalizedItems.length,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          };
        }
        if (Array.isArray(payload)) {
          const normalizedItems = payload.map((item: any) =>
            this.normalizeShipmentItem(item)
          );
          return {
            items: normalizedItems,
            meta: {
              total: normalizedItems.length,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          };
        }
        return this.getFallbackPaginatedShipments(query);
      }),
      catchError(() => of(this.getFallbackPaginatedShipments(query)))
    );
  }

  /**
   * Retrieves a single shipment by ID.
   */
  getShipment(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map((res) => res?.data ?? res),
      catchError(() => {
        const found =
          this.demoShipments.find((s) => s.id === id || s.trackingNumber === id) ??
          this.demoShipments[0];
        return of(found);
      })
    );
  }

  /**
   * Creates a new shipment booking.
   * Calls POST /api/shipments and unwrap res?.data ?? res.
   */
  createShipment(dto: CreateShipmentPayload): Observable<any> {
    const payload = {
      ...dto,
      eta: dto.eta || new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      map((res) => {
        const created = res?.data ?? res;
        const normalized = this.normalizeShipmentItem(created);
        this.addShipmentToDemoStore(normalized);
        return normalized;
      }),
      catchError(() => {
        const fallbackCreated: ShipmentItem = {
          id: `shipment-${Date.now()}`,
          trackingNumber: dto.trackingNumber || `CP-${Date.now().toString().slice(-6)}`,
          origin: dto.origin,
          destination: dto.destination,
          carrierName: dto.carrierName,
          status: 'PENDING',
          estimatedDelivery: payload.eta,
          alertsCount: 0,
          stagesCount: 5,
        };
        this.addShipmentToDemoStore(fallbackCreated);
        return of(fallbackCreated);
      })
    );
  }

  /**
   * Retrieves 3-level hierarchical discussion tree for a shipment.
   * Calls GET /api/collaboration/shipment/:shipmentId/tree
   */
  getNotesTree(shipmentId: string): Observable<NoteTreeNode[]> {
    return this.http
      .get<any>(`${this.collabUrl}/shipment/${shipmentId}/tree`)
      .pipe(
        map((res) => {
          const payload = res?.data ?? res;
          if (Array.isArray(payload) && payload.length > 0) {
            this.demoTreesByShipment[shipmentId] = payload;
            return payload as NoteTreeNode[];
          }
          return this.getFallbackTree(shipmentId);
        }),
        catchError(() => of(this.getFallbackTree(shipmentId)))
      );
  }

  /**
   * Creates a new note or threaded reply up to 3 levels deep.
   * Calls POST /api/collaboration/shipment/:shipmentId/notes
   */
  createNote(shipmentId: string, payload: CreateNotePayload): Observable<any> {
    return this.http
      .post<any>(`${this.collabUrl}/shipment/${shipmentId}/notes`, payload)
      .pipe(
        map((res) => {
          const created = res?.data ?? res;
          this.insertNoteIntoInMemoryTree(shipmentId, created);
          return created;
        }),
        catchError(() => {
          const fallbackNote: NoteTreeNode = {
            id: `note-${Date.now()}`,
            shipmentId,
            authorId: 'user-demo-ops',
            author: {
              id: 'user-demo-ops',
              firstName: 'Carlos',
              lastName: 'Mendez',
              email: 'carlos.mendez@cargopulse.io',
              role: 'OPERATIONS_COORDINATOR',
            },
            parentId: payload.parentId ?? null,
            content: payload.content,
            attachmentUrl: payload.attachmentUrl ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replies: [],
          };
          this.insertNoteIntoInMemoryTree(shipmentId, fallbackNote);
          return of(fallbackNote);
        })
      );
  }

  private normalizeShipmentItem(item: any): ShipmentItem {
    return {
      id: item.id || `shipment-${Date.now()}`,
      trackingNumber: item.trackingNumber || 'CP-UNKNOWN',
      origin: item.origin || '',
      destination: item.destination || '',
      carrierName: item.carrierName || '',
      status: item.status || item.currentStatus || 'IN_TRANSIT',
      estimatedDelivery:
        item.estimatedDelivery || item.eta || new Date().toISOString(),
      alertsCount:
        typeof item.alertsCount === 'number'
          ? item.alertsCount
          : item._count?.alerts ?? 0,
      stagesCount:
        typeof item.stagesCount === 'number'
          ? item.stagesCount
          : Array.isArray(item.stages)
          ? item.stages.length
          : 5,
      currentStatus: item.currentStatus || item.status,
      eta: item.eta || item.estimatedDelivery,
    };
  }

  private getFallbackPaginatedShipments(query?: any): PaginatedShipments {
    let list = [...this.demoShipments];
    if (query?.search) {
      const q = String(query.search).toLowerCase();
      list = list.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(q) ||
          s.carrierName.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q)
      );
    }
    return {
      items: list,
      meta: {
        total: list.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
  }

  private addShipmentToDemoStore(shipment: ShipmentItem): void {
    const exists = this.demoShipments.some((s) => s.id === shipment.id);
    if (!exists) {
      this.demoShipments = [shipment, ...this.demoShipments];
    }
  }

  private getFallbackTree(shipmentId: string): NoteTreeNode[] {
    if (!this.demoTreesByShipment[shipmentId]) {
      this.demoTreesByShipment[shipmentId] = this.createDefaultTreeForShipment(shipmentId);
    }
    return JSON.parse(JSON.stringify(this.demoTreesByShipment[shipmentId]));
  }

  private insertNoteIntoInMemoryTree(
    shipmentId: string,
    createdNote: any
  ): void {
    const tree = this.demoTreesByShipment[shipmentId] || this.createDefaultTreeForShipment(shipmentId);
    const node: NoteTreeNode = {
      id: createdNote.id || `note-${Date.now()}`,
      shipmentId,
      authorId: createdNote.authorId || createdNote.author?.id || 'user-demo',
      author: createdNote.author || {
        id: 'user-demo',
        firstName: 'Carlos',
        lastName: 'Mendez',
        email: 'carlos.mendez@cargopulse.io',
        role: 'OPERATIONS_COORDINATOR',
      },
      parentId: createdNote.parentId ?? null,
      content: createdNote.content,
      attachmentUrl: createdNote.attachmentUrl ?? null,
      createdAt: createdNote.createdAt || new Date().toISOString(),
      updatedAt: createdNote.updatedAt || new Date().toISOString(),
      replies: createdNote.replies || [],
    };

    if (!node.parentId) {
      tree.unshift(node);
    } else {
      const inserted = this.insertIntoParent(tree, node.parentId, node);
      if (!inserted) {
        tree.push(node);
      }
    }
    this.demoTreesByShipment[shipmentId] = tree;
  }

  private insertIntoParent(
    nodes: NoteTreeNode[],
    parentId: string,
    child: NoteTreeNode
  ): boolean {
    for (const node of nodes) {
      if (node.id === parentId) {
        node.replies = [...(node.replies || []), child];
        return true;
      }
      if (node.replies && node.replies.length > 0) {
        const found = this.insertIntoParent(node.replies, parentId, child);
        if (found) return true;
      }
    }
    return false;
  }

  private seedDefaultTrees(): void {
    for (const shipment of this.demoShipments) {
      this.demoTreesByShipment[shipment.id] = this.createDefaultTreeForShipment(
        shipment.id
      );
    }
  }

  private createDefaultTreeForShipment(shipmentId: string): NoteTreeNode[] {
    return [
      {
        id: `note-l1-${shipmentId}-1`,
        shipmentId,
        authorId: 'usr-ops-01',
        author: {
          id: 'usr-ops-01',
          firstName: 'Elena',
          lastName: 'Vargas',
          email: 'elena.vargas@cargopulse.io',
          role: 'CARRIER_OPS',
        },
        parentId: null,
        content:
          'Master Vessel MSC OSCAR encountered severe weather in East China Sea. Anchorage delay estimated at 16h; terminal transshipment revised accordingly.',
        attachmentUrl: null,
        createdAt: '2026-10-16T08:30:00.000Z',
        updatedAt: '2026-10-16T08:30:00.000Z',
        replies: [
          {
            id: `note-l2-${shipmentId}-1`,
            shipmentId,
            authorId: 'usr-fwd-01',
            author: {
              id: 'usr-fwd-01',
              firstName: 'Marcus',
              lastName: 'Chen',
              email: 'marcus.chen@cargopulse.io',
              role: 'FREIGHT_FORWARDER',
            },
            parentId: `note-l1-${shipmentId}-1`,
            content:
              'House B/L #HBL-99201 customs clearance pre-advisement lodged with US CBP. Drayage appointment rebooked for terminal Pier 400.',
            attachmentUrl: null,
            createdAt: '2026-10-16T11:15:00.000Z',
            updatedAt: '2026-10-16T11:15:00.000Z',
            replies: [
              {
                id: `note-l3-${shipmentId}-1`,
                shipmentId,
                authorId: 'usr-qa-01',
                author: {
                  id: 'usr-qa-01',
                  firstName: 'Sofia',
                  lastName: 'Reyes',
                  email: 'sofia.reyes@cargopulse.io',
                  role: 'QUALITY_INSPECTOR',
                },
                parentId: `note-l2-${shipmentId}-1`,
                content:
                  'SKU #BIO-9021 (Temperature-Controlled Pharma): IoT Telemetry tag #TH-882 confirms +4.2°C nominal range during anchorage wait. Battery at 96%.',
                attachmentUrl: null,
                createdAt: '2026-10-16T14:40:00.000Z',
                updatedAt: '2026-10-16T14:40:00.000Z',
                replies: [],
              },
            ],
          },
        ],
      },
      {
        id: `note-l1-${shipmentId}-2`,
        shipmentId,
        authorId: 'usr-disp-02',
        author: {
          id: 'usr-disp-02',
          firstName: 'Julian',
          lastName: 'Kovac',
          email: 'julian.kovac@cargopulse.io',
          role: 'DISPATCHER',
        },
        parentId: null,
        content:
          'Chassis availability verified at destination rail ramp. Intermodal rail car assigned: BNSF-882194.',
        attachmentUrl: null,
        createdAt: '2026-10-16T16:00:00.000Z',
        updatedAt: '2026-10-16T16:00:00.000Z',
        replies: [],
      },
    ];
  }
}
