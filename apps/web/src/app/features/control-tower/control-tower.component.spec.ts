import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ControlTowerComponent } from './control-tower.component';
import { ControlTowerService } from './services/control-tower.service';
import { TopologyNode, TopologyLink } from './models/topology.model';

describe('ControlTowerComponent', () => {
  let component: ControlTowerComponent;
  let fixture: ComponentFixture<ControlTowerComponent>;
  let controlTowerService: ControlTowerService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ControlTowerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ControlTowerService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ControlTowerComponent);
    component = fixture.componentInstance;
    component.languageService.setLanguage('es');
    controlTowerService = TestBed.inject(ControlTowerService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize nodes, links, and shipments from service data', () => {
    expect(component.nodes().length).toBe(6);
    expect(component.links().length).toBe(8);
    expect(component.shipments().length).toBe(6);
  });

  describe('KPIs computation', () => {
    it('should compute active nodes correctly', () => {
      const kpis = component.kpis();
      expect(kpis.activeNodes).toBe(6);
    });

    it('should compute in-transit shipments count correctly', () => {
      const kpis = component.kpis();
      // 4 IN_TRANSIT + 1 OUT_FOR_DELIVERY = 5
      expect(kpis.inTransitShipments).toBe(5);
    });

    it('should compute customs holds count correctly', () => {
      const kpis = component.kpis();
      // 1 CUSTOMS_HOLD shipment (SHP-1003)
      expect(kpis.customsHolds).toBe(1);
    });

    it('should compute on-time arrival rate correctly', () => {
      const kpis = component.kpis();
      // 4 out of 6 shipments have delayRisk !== HIGH (66.7%)
      expect(kpis.onTimeRate).toBe('66.7%');
    });

    it('should handle empty shipments array for KPIs calculation', () => {
      component.shipments.set([]);
      component.nodes.set([]);
      const kpis = component.kpis();
      expect(kpis.activeNodes).toBe(0);
      expect(kpis.inTransitShipments).toBe(0);
      expect(kpis.customsHolds).toBe(0);
      expect(kpis.onTimeRate).toBe('100.0%');
    });
  });

  describe('Reactive Node Selection & Filtering', () => {
    it('should select an ORIGIN node and filter shipments appropriately', () => {
      const originNode = component.nodes().find(n => n.id === 'monterrey-assembly')?.data as TopologyNode;
      expect(originNode).toBeDefined();

      component.onSelectNode(originNode);

      expect(component.selectedNode()).toEqual(originNode);
      expect(component.selectedLink()).toBeNull();

      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(3);
      expect(filtered.every(s =>
        s.origin === 'Monterrey Assembly' || s.routeNodeIds?.includes('monterrey-assembly')
      )).toBe(true);
    });

    it('should select a CUSTOMS_BORDER node and filter shipments traversing or held at customs', () => {
      const customsNode = component.nodes().find(n => n.id === 'nuevo-laredo-customs')?.data as TopologyNode;
      expect(customsNode).toBeDefined();

      component.onSelectNode(customsNode);

      expect(component.selectedNode()).toEqual(customsNode);
      expect(component.selectedLink()).toBeNull();

      const filtered = component.filteredShipments();
      // SHP-1001, SHP-1002, SHP-1003 pass through Nuevo Laredo Customs
      expect(filtered.length).toBe(3);
      expect(filtered.some(s => s.id === 'SHP-1003')).toBe(true);
    });

    it('should select a DESTINATION node and filter shipments for that destination', () => {
      const destNode = component.nodes().find(n => n.id === 'chicago-depot')?.data as TopologyNode;
      expect(destNode).toBeDefined();

      component.onSelectNode(destNode);

      expect(component.selectedNode()).toEqual(destNode);
      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.destination === 'Chicago Depot')).toBe(true);
    });
  });

  describe('Reactive Link Selection & Filtering', () => {
    it('should select a corridor link and filter shipments by routeLinkIds', () => {
      const link = component.links().find(l => l.id === 'link-mty-nld')?.data as TopologyLink;
      expect(link).toBeDefined();

      component.onSelectLink(link);

      expect(component.selectedLink()).toEqual(link);
      expect(component.selectedNode()).toBeNull();

      const filtered = component.filteredShipments();
      // SHP-1001 and SHP-1002 traverse Carretera 85D
      expect(filtered.length).toBe(2);
      expect(filtered.map(s => s.id)).toEqual(['SHP-1001', 'SHP-1002']);
    });

    it('should select an air corridor link and filter air express shipments', () => {
      const link = component.links().find(l => l.id === 'link-hou-ord')?.data as TopologyLink;
      expect(link).toBeDefined();

      component.onSelectLink(link);

      const filtered = component.filteredShipments();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('SHP-1005');
      expect(filtered[0].carrierName).toBe('AeroMexico Cargo');
    });
  });

  describe('Clear Filter', () => {
    it('should reset selections and restore full shipment list', () => {
      const node = component.nodes()[0].data as TopologyNode;
      component.onSelectNode(node);
      expect(component.filteredShipments().length).toBeLessThan(component.shipments().length);

      component.clearFilter();

      expect(component.selectedNode()).toBeNull();
      expect(component.selectedLink()).toBeNull();
      expect(component.filteredShipments().length).toBe(6);
    });
  });

  describe('Graph Event Handlers', () => {
    it('should delegate graph select event to onSelectLink when source and target exist', () => {
      const edge = component.links()[0];
      const spy = vi.spyOn(component, 'onSelectLink');

      component.onGraphSelect(edge);

      expect(spy).toHaveBeenCalledWith(edge);
    });

    it('should delegate graph select event to onSelectNode when source and target are absent', () => {
      const node = component.nodes()[0];
      const spy = vi.spyOn(component, 'onSelectNode');

      component.onGraphSelect(node);

      expect(spy).toHaveBeenCalledWith(node);
    });

    it('should handle null or undefined gracefully in onGraphSelect and selectors', () => {
      expect(() => component.onGraphSelect(null)).not.toThrow();
      expect(() => component.onSelectNode(null)).not.toThrow();
      expect(() => component.onSelectLink(null)).not.toThrow();
    });
  });

  describe('Telemetry Refresh', () => {
    it('should invoke controlTowerService.getTopologyData on refreshTelemetry', () => {
      const spy = vi.spyOn(controlTowerService, 'getTopologyData');
      component.refreshTelemetry();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('UI Styling & Format Helpers', () => {
    it('should return appropriate link colors based on transport mode', () => {
      expect(component.getLinkColor('ROAD')).toBe('#64748b');
      expect(component.getLinkColor('RAIL')).toBe('#8b5cf6');
      expect(component.getLinkColor('OCEAN')).toBe('#0284c7');
      expect(component.getLinkColor('AIR')).toBe('#06b6d4');
      expect(component.getLinkColor('UNKNOWN')).toBe('#64748b');
    });

    it('should return appropriate status badge classes', () => {
      expect(component.getStatusBadgeClass('IN_TRANSIT')).toContain('text-blue-400');
      expect(component.getStatusBadgeClass('CUSTOMS_HOLD')).toContain('text-amber-400');
      expect(component.getStatusBadgeClass('OUT_FOR_DELIVERY')).toContain('text-purple-400');
      expect(component.getStatusBadgeClass('DELIVERED')).toContain('text-emerald-400');
      expect(component.getStatusBadgeClass('OTHER')).toContain('border-slate-700');
    });

    it('should format status strings by replacing underscores with spaces', () => {
      expect(component.formatStatus('IN_TRANSIT')).toBe('IN TRANSIT');
      expect(component.formatStatus('CUSTOMS_HOLD')).toBe('CUSTOMS HOLD');
    });

    it('should return appropriate risk badge classes and dot colors', () => {
      expect(component.getRiskBadgeClass('LOW')).toContain('text-emerald-400');
      expect(component.getRiskBadgeClass('MEDIUM')).toContain('text-amber-400');
      expect(component.getRiskBadgeClass('HIGH')).toContain('text-red-400');

      expect(component.getRiskDotClass('LOW')).toBe('bg-emerald-400');
      expect(component.getRiskDotClass('MEDIUM')).toBe('bg-amber-400');
      expect(component.getRiskDotClass('HIGH')).toBe('bg-red-400');
    });
  });

  describe('DOM Rendering', () => {
    it('should render page title and subtitle in default Spanish and switch to English', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Torre de Control y DAG de Topología');
      expect(el.textContent).toContain('transfronteriza');

      component.languageService.setLanguage('en');
      fixture.detectChanges();
      expect(el.textContent).toContain('Control Tower & Topology DAG');
      expect(el.textContent).toContain('cross-border');
    });

    it('should render Quick KPI strip cards in default Spanish and switch to English', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Nodos DAG Activos');
      expect(el.textContent).toContain('Envíos en Tránsito');
      expect(el.textContent).toContain('Retenciones Aduanales');
      expect(el.textContent).toContain('Llegadas a Tiempo (OTA)');

      component.languageService.setLanguage('en');
      fixture.detectChanges();
      expect(el.textContent).toContain('Active DAG Nodes');
      expect(el.textContent).toContain('In-Transit Shipments');
      expect(el.textContent).toContain('Customs Holds');
      expect(el.textContent).toContain('On-Time Arrival (OTA)');
    });

    it('should render shipments table with carrier and tracking info', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('CP-MXUS-2026-001');
      expect(el.textContent).toContain('TUM Logistica');
      expect(el.textContent).toContain('BNSF Railway');
      expect(el.textContent).toContain('AeroMexico Cargo');
    });

    it('should render Clear Filter button when a node is selected and clear upon click', () => {
      const node = component.nodes()[0].data as TopologyNode;
      component.onSelectNode(node);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const clearBtn = el.querySelector('.clear-filter-btn') as HTMLButtonElement;
      expect(clearBtn).toBeTruthy();

      clearBtn.click();
      fixture.detectChanges();

      expect(component.selectedNode()).toBeNull();
      expect(component.filteredShipments().length).toBe(6);
    });
  });
});
