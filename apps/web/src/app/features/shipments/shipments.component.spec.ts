import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { ShipmentsComponent } from './shipments.component';
import { ShipmentsService } from './services/shipments.service';
import { LanguageService } from '@core/services/language.service';
import { AuthStore } from '@core/state/auth.store';
import { NoteTreeNode, ShipmentItem } from './models/shipment.model';

describe('ShipmentsComponent', () => {
  let component: ShipmentsComponent;
  let fixture: ComponentFixture<ShipmentsComponent>;
  let shipmentsService: ShipmentsService;
  let languageService: LanguageService;
  let httpMock: HttpTestingController;

  const mockShipments: ShipmentItem[] = [
    {
      id: 'sh-1',
      trackingNumber: 'CP-2026-X9810',
      origin: 'Shanghai Yangshan (CNSHA)',
      destination: 'Los Angeles Pier 400 (USLAX)',
      carrierName: 'Ocean Network Express',
      status: 'IN_TRANSIT',
      estimatedDelivery: '2026-10-24T18:00:00.000Z',
      alertsCount: 2,
      stagesCount: 5,
    },
    {
      id: 'sh-2',
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
      id: 'sh-3',
      trackingNumber: 'CP-2026-R4419',
      origin: 'Rotterdam Maasvlakte (NLRTM)',
      destination: 'Munich Riem Terminal (DEMUC)',
      carrierName: 'DB Cargo Rail Logistics',
      status: 'DELIVERED',
      estimatedDelivery: '2026-10-15T09:15:00.000Z',
      alertsCount: 0,
      stagesCount: 5,
    },
  ];

  const mockNotesTree: NoteTreeNode[] = [
    {
      id: 'l1-note-1',
      shipmentId: 'sh-1',
      authorId: 'usr-1',
      author: {
        id: 'usr-1',
        firstName: 'Elena',
        lastName: 'Vargas',
        email: 'elena@cargopulse.io',
        role: 'CARRIER_OPS',
      },
      parentId: null,
      content: 'Master Vessel MSC OSCAR transshipment revised due to weather.',
      attachmentUrl: null,
      createdAt: '2026-10-16T08:30:00.000Z',
      updatedAt: '2026-10-16T08:30:00.000Z',
      replies: [
        {
          id: 'l2-note-1',
          shipmentId: 'sh-1',
          authorId: 'usr-2',
          author: {
            id: 'usr-2',
            firstName: 'Marcus',
            lastName: 'Chen',
            email: 'marcus@cargopulse.io',
            role: 'FREIGHT_FORWARDER',
          },
          parentId: 'l1-note-1',
          content: 'House B/L #HBL-99201 customs clearance pre-advisement lodged.',
          attachmentUrl: null,
          createdAt: '2026-10-16T11:15:00.000Z',
          updatedAt: '2026-10-16T11:15:00.000Z',
          replies: [
            {
              id: 'l3-note-1',
              shipmentId: 'sh-1',
              authorId: 'usr-3',
              author: {
                id: 'usr-3',
                firstName: 'Sofia',
                lastName: 'Reyes',
                email: 'sofia@cargopulse.io',
                role: 'QUALITY_INSPECTOR',
              },
              parentId: 'l2-note-1',
              content: 'SKU #BIO-9021 IoT tag confirms +4.2°C temperature.',
              attachmentUrl: null,
              createdAt: '2026-10-16T14:40:00.000Z',
              updatedAt: '2026-10-16T14:40:00.000Z',
              replies: [],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ShipmentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ShipmentsService,
        LanguageService,
        AuthStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentsComponent);
    component = fixture.componentInstance;
    shipmentsService = TestBed.inject(ShipmentsService);
    languageService = TestBed.inject(LanguageService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock initial getShipments call to return deterministic test data
    vi.spyOn(shipmentsService, 'getShipments').mockReturnValue(
      of({
        items: [...mockShipments],
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      })
    );

    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component and initialize shipments', () => {
    expect(component).toBeTruthy();
    expect(component.shipments().length).toBe(3);
    expect(component.filteredShipments().length).toBe(3);
  });

  describe('Shipments Table Rendering', () => {
    it('should render shipment rows in the table', () => {
      const rows = fixture.nativeElement.querySelectorAll(
        '[data-testid="shipment-row"]'
      );
      expect(rows.length).toBe(3);

      const firstRowText = rows[0].textContent;
      expect(firstRowText).toContain('CP-2026-X9810');
      expect(firstRowText).toContain('Shanghai');
      expect(firstRowText).toContain('Ocean Network Express');
    });

    it('should compute KPI counts from shipments', () => {
      expect(component.totalActiveCount()).toBe(3);
      expect(component.oceanContainersCount()).toBe(1);
      expect(component.airExpressCount()).toBe(1);
      expect(component.railCarsCount()).toBe(1);
    });
  });

  describe('Search Filtering', () => {
    it('should filter shipments by tracking number', () => {
      component.searchQuery.set('X9810');
      fixture.detectChanges();

      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(1);
      expect(filtered[0].trackingNumber).toBe('CP-2026-X9810');

      const rows = fixture.nativeElement.querySelectorAll(
        '[data-testid="shipment-row"]'
      );
      expect(rows.length).toBe(1);
    });

    it('should filter shipments by carrier name (case-insensitive)', () => {
      component.searchQuery.set('lufthansa');
      fixture.detectChanges();

      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(1);
      expect(filtered[0].carrierName).toBe('Lufthansa Cargo AWB');
    });

    it('should filter shipments by origin or destination city', () => {
      component.searchQuery.set('Munich');
      fixture.detectChanges();

      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(1);
      expect(filtered[0].destination).toContain('Munich');
    });

    it('should handle search input event', () => {
      const inputEl = fixture.nativeElement.querySelector(
        '[data-testid="search-input"]'
      );
      inputEl.value = 'Rotterdam';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.searchQuery()).toBe('Rotterdam');
      expect(component.filteredShipments().length).toBe(1);
    });
  });

  describe('3-Level Notes Tree Panel', () => {
    beforeEach(() => {
      vi.spyOn(shipmentsService, 'getNotesTree').mockReturnValue(
        of(mockNotesTree)
      );
    });

    it('should open notes tree drawer when selecting a shipment', () => {
      const targetShipment = mockShipments[0];
      component.openNotesTree(targetShipment);
      fixture.detectChanges();

      expect(component.selectedShipment()).toEqual(targetShipment);
      expect(component.notesTree().length).toBe(1);

      const panel = fixture.nativeElement.querySelector(
        '[data-testid="notes-tree-panel"]'
      );
      expect(panel).toBeTruthy();
    });

    it('should render Level 1 (Master B/L), Level 2 (House B/L), and Level 3 (SKU Item)', () => {
      component.openNotesTree(mockShipments[0]);
      fixture.detectChanges();

      const l1Nodes = fixture.nativeElement.querySelectorAll(
        '[data-testid="level-1-node"]'
      );
      const l2Nodes = fixture.nativeElement.querySelectorAll(
        '[data-testid="level-2-node"]'
      );
      const l3Nodes = fixture.nativeElement.querySelectorAll(
        '[data-testid="level-3-node"]'
      );

      expect(l1Nodes.length).toBe(1);
      expect(l2Nodes.length).toBe(1);
      expect(l3Nodes.length).toBe(1);

      // Verify Level 1 has a reply button
      const l1ReplyBtn = l1Nodes[0].querySelector('[data-testid="reply-btn"]');
      expect(l1ReplyBtn).toBeTruthy();

      // Verify Level 2 has a reply button
      const l2ReplyBtn = l2Nodes[0].querySelector('[data-testid="reply-btn"]');
      expect(l2ReplyBtn).toBeTruthy();

      // Verify Level 3 has NO reply button (max depth enforced)
      const l3ReplyBtn = l3Nodes[0].querySelector('[data-testid="reply-btn"]');
      expect(l3ReplyBtn).toBeFalsy();
    });

    it('should close notes tree when close button is clicked', () => {
      component.openNotesTree(mockShipments[0]);
      fixture.detectChanges();

      component.closeNotesTree();
      fixture.detectChanges();

      expect(component.selectedShipment()).toBeNull();
      expect(component.notesTree().length).toBe(0);

      const panel = fixture.nativeElement.querySelector(
        '[data-testid="notes-tree-panel"]'
      );
      expect(panel).toBeFalsy();
    });
  });

  describe('Replying and Creating Notes', () => {
    beforeEach(() => {
      vi.spyOn(shipmentsService, 'getNotesTree').mockReturnValue(
        of(mockNotesTree)
      );
      component.openNotesTree(mockShipments[0]);
      fixture.detectChanges();
    });

    it('should open note composer when starting a root note (Level 1)', () => {
      component.startRootNote();
      fixture.detectChanges();

      expect(component.isCreatingRootNote()).toBe(true);
      expect(component.replyingToNote()).toBeNull();

      const composer = fixture.nativeElement.querySelector(
        '[data-testid="note-composer"]'
      );
      expect(composer).toBeTruthy();
    });

    it('should open note composer with parent context when replying to Level 1 note', () => {
      const l1 = mockNotesTree[0];
      component.startReply(l1);
      fixture.detectChanges();

      expect(component.replyingToNote()).toEqual(l1);
      expect(component.isCreatingRootNote()).toBe(false);

      const composer = fixture.nativeElement.querySelector(
        '[data-testid="note-composer"]'
      );
      expect(composer).toBeTruthy();
      expect(composer.textContent).toContain(l1.author.firstName);
    });

    it('should submit note via shipmentsService and reload tree', () => {
      const createNoteSpy = vi
        .spyOn(shipmentsService, 'createNote')
        .mockReturnValue(
          of({
            id: 'note-new',
            content: 'Acknowledged vessel delay and notified consignee.',
            parentId: 'l1-note-1',
          } as any)
        );

      component.startReply(mockNotesTree[0]);
      component.noteContent.set('Acknowledged vessel delay and notified consignee.');
      fixture.detectChanges();

      component.submitNote();

      expect(createNoteSpy).toHaveBeenCalledWith(mockShipments[0].id, {
        content: 'Acknowledged vessel delay and notified consignee.',
        parentId: 'l1-note-1',
      });
      expect(component.replyingToNote()).toBeNull();
      expect(component.noteContent()).toBe('');
    });
  });

  describe('New Booking Modal', () => {
    it('should open and close new booking modal', () => {
      expect(component.isCreatingBooking()).toBe(false);

      component.openNewBookingModal();
      fixture.detectChanges();
      expect(component.isCreatingBooking()).toBe(true);

      const modal = fixture.nativeElement.querySelector(
        '[data-testid="booking-modal"]'
      );
      expect(modal).toBeTruthy();

      component.closeNewBookingModal();
      fixture.detectChanges();
      expect(component.isCreatingBooking()).toBe(false);
    });

    it('should validate form and submit new booking', () => {
      const newShipment: ShipmentItem = {
        id: 'sh-new-99',
        trackingNumber: 'CP-2026-N99',
        origin: 'Tokyo Narita',
        destination: 'Dallas/Fort Worth',
        carrierName: 'Polar Air Cargo',
        status: 'PENDING',
        estimatedDelivery: '2026-11-01T00:00:00Z',
        alertsCount: 0,
        stagesCount: 5,
      };

      const createShipmentSpy = vi
        .spyOn(shipmentsService, 'createShipment')
        .mockReturnValue(of(newShipment));

      component.openNewBookingModal();
      component.newBookingForm.set({
        trackingNumber: 'CP-2026-N99',
        origin: 'Tokyo Narita',
        destination: 'Dallas/Fort Worth',
        carrierName: 'Polar Air Cargo',
      });
      fixture.detectChanges();

      expect(component.isBookingFormValid()).toBe(true);

      component.submitBooking();

      expect(createShipmentSpy).toHaveBeenCalledWith({
        trackingNumber: 'CP-2026-N99',
        origin: 'Tokyo Narita',
        destination: 'Dallas/Fort Worth',
        carrierName: 'Polar Air Cargo',
      });
      expect(component.shipments()[0]).toEqual(newShipment);
      expect(component.isCreatingBooking()).toBe(false);
    });
  });
});
