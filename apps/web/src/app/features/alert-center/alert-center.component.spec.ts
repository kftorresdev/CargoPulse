import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AlertCenterComponent } from './alert-center.component';
import { AlertCenterService } from './services/alert-center.service';
import { LanguageService } from '@core/services/language.service';
import { AlertKpis, OperationalAlert } from './models/alert.model';

describe('AlertCenterComponent', () => {
  let component: AlertCenterComponent;
  let fixture: ComponentFixture<AlertCenterComponent>;
  let alertCenterService: AlertCenterService;
  let languageService: LanguageService;

  const mockKpis: AlertKpis = {
    totalAlerts: 4,
    criticalCount: 2,
    highCount: 1,
    mediumCount: 1,
    lowCount: 0,
    openCount: 3,
    resolvedCount: 1,
    totalFinancialImpactUsd: 4500,
    slaBreachedCount: 1,
  };

  const mockAlerts: OperationalAlert[] = [
    {
      id: 'alert-crit-1',
      shipmentId: 's1',
      shipmentTracking: 'CP-2026-X9810',
      carrier: 'Maersk Line',
      title: 'Vessel Berth Delay Exceeding 18 Hours',
      description: 'Pharma reefer boxes at risk.',
      severity: 'CRITICAL',
      status: 'OPEN',
      slaDeadline: new Date(Date.now() + 3600 * 1000).toISOString(),
      slaRemaining: '01:00:00',
      financialImpactUsd: 1450,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-crit-2',
      shipmentId: 's2',
      shipmentTracking: 'CP-2026-M5532',
      carrier: 'BNSF Railway',
      title: 'Rail Car Mechanical Defect',
      description: 'Hot box detector alert.',
      severity: 'CRITICAL',
      status: 'OPEN',
      slaDeadline: new Date(Date.now() - 1800 * 1000).toISOString(),
      slaRemaining: 'BREACHED',
      financialImpactUsd: 2200,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-high-1',
      shipmentId: 's3',
      shipmentTracking: 'CP-2026-E4421',
      carrier: 'Lufthansa Cargo',
      title: 'Missing Commercial Invoice',
      description: 'Air cargo grounded in Chicago.',
      severity: 'HIGH',
      status: 'OPEN',
      slaDeadline: new Date(Date.now() + 7200 * 1000).toISOString(),
      slaRemaining: '02:00:00',
      financialImpactUsd: 850,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-med-1',
      shipmentId: 's4',
      shipmentTracking: 'CP-2026-T7719',
      carrier: 'OceanBridge Global',
      title: 'Fuel Surcharge Variance',
      description: 'Over-billed BAF rate.',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      slaDeadline: new Date(Date.now() - 3600 * 1000).toISOString(),
      slaRemaining: 'BREACHED',
      financialImpactUsd: 350,
      resolutionNotes: 'Credit note approved by carrier.',
      resolvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AlertCenterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AlertCenterService,
        LanguageService,
      ],
    }).compileComponents();

    alertCenterService = TestBed.inject(AlertCenterService);
    languageService = TestBed.inject(LanguageService);
    languageService.setLanguage('es');

    vi.spyOn(alertCenterService, 'getKpis').mockReturnValue(of(mockKpis));
    vi.spyOn(alertCenterService, 'getAlerts').mockReturnValue(of(mockAlerts));

    fixture = TestBed.createComponent(AlertCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create the AlertCenterComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize KPIs and alerts signals on ngOnInit', () => {
    expect(component.kpis()).toEqual(mockKpis);
    expect(component.alerts()).toEqual(mockAlerts);
    expect(component.filteredAlerts()).toHaveLength(4);
  });

  describe('KPI Strip rendering', () => {
    it('should display correct counts in KPI cards', () => {
      const el: HTMLElement = fixture.nativeElement;
      const criticalCard = el.querySelector('.border-rose-500\\/30');
      expect(criticalCard?.textContent).toContain('2'); // criticalCount

      const highCard = el.querySelector('.border-amber-500\\/30');
      expect(highCard?.textContent).toContain('1'); // highCount

      const impactCard = el.querySelector('.border-emerald-500\\/30');
      expect(impactCard?.textContent).toContain('$4,500'); // formatted totalFinancialImpactUsd
    });
  });

  describe('Filter Switching', () => {
    it('should default to filter ALL', () => {
      expect(component.selectedFilter()).toBe('ALL');
      expect(component.filteredAlerts()).toHaveLength(4);
    });

    it('should filter by CRITICAL severity', () => {
      component.setFilter('CRITICAL');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(2);
      expect(component.filteredAlerts().every((a) => a.severity === 'CRITICAL')).toBe(true);
    });

    it('should filter by HIGH severity', () => {
      component.setFilter('HIGH');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(1);
      expect(component.filteredAlerts()[0].id).toBe('alert-high-1');
    });

    it('should filter by MEDIUM severity', () => {
      component.setFilter('MEDIUM');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(1);
      expect(component.filteredAlerts()[0].id).toBe('alert-med-1');
    });

    it('should filter by LOW severity returning empty if none exist', () => {
      component.setFilter('LOW');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(0);
    });

    it('should filter by OPEN status (includes OPEN and IN_PROGRESS)', () => {
      component.setFilter('OPEN');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(3);
      expect(component.filteredAlerts().every((a) => a.status === 'OPEN')).toBe(true);
    });

    it('should filter by RESOLVED status', () => {
      component.setFilter('RESOLVED');
      fixture.detectChanges();

      expect(component.filteredAlerts()).toHaveLength(1);
      expect(component.filteredAlerts()[0].id).toBe('alert-med-1');
    });

    it('should return accurate counts for each filter option', () => {
      expect(component.getFilterCount('ALL')).toBe(4);
      expect(component.getFilterCount('CRITICAL')).toBe(2);
      expect(component.getFilterCount('HIGH')).toBe(1);
      expect(component.getFilterCount('OPEN')).toBe(3);
      expect(component.getFilterCount('RESOLVED')).toBe(1);
    });
  });

  describe('Dynamic SLA Countdown calculation', () => {
    it('should mark deadline as breached when deadline is in past', () => {
      const pastDeadline = new Date(Date.now() - 60000).toISOString();
      const countdown = component.getCountdown(pastDeadline);

      expect(countdown.isBreached).toBe(true);
      expect(countdown.text).toBe('INCUMPLIDO');
    });

    it('should format remaining time as HH:MM:SS when deadline is in future', () => {
      const futureDeadline = new Date(Date.now() + (3600 + 120 + 5) * 1000).toISOString();
      const countdown = component.getCountdown(futureDeadline);

      expect(countdown.isBreached).toBe(false);
      expect(countdown.text).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should update countdown dynamically when nowTick changes', () => {
      const deadline = new Date(Date.now() + 10000).toISOString();
      const initial = component.getCountdown(deadline);
      expect(initial.isBreached).toBe(false);

      // Advance nowTick past deadline
      component.nowTick.set(Date.now() + 20000);
      const after = component.getCountdown(deadline);
      expect(after.isBreached).toBe(true);
      expect(after.text).toBe('INCUMPLIDO');
    });
  });

  describe('Resolution Modal workflow', () => {
    it('should open modal when openResolveModal is called', () => {
      const targetAlert = mockAlerts[0];
      component.openResolveModal(targetAlert);
      fixture.detectChanges();

      expect(component.resolvingAlert()).toBe(targetAlert);
      expect(component.resolutionNotes()).toBe('');

      const modal = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('CP-2026-X9810');
    });

    it('should close modal when closeResolveModal is called', () => {
      component.openResolveModal(mockAlerts[0]);
      fixture.detectChanges();

      component.closeResolveModal();
      fixture.detectChanges();

      expect(component.resolvingAlert()).toBeNull();
      const modal = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(modal).toBeNull();
    });

    it('should not submit resolution when resolution notes are empty or whitespace', () => {
      const spy = vi.spyOn(alertCenterService, 'resolveAlert');
      component.openResolveModal(mockAlerts[0]);
      component.resolutionNotes.set('   ');

      component.confirmResolution();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should resolve alert, update signal state, refresh KPIs, and close modal', () => {
      const targetAlert = mockAlerts[0];
      const resolvedTarget: OperationalAlert = {
        ...targetAlert,
        status: 'RESOLVED',
        resolutionNotes: 'Pilot berth authorization issued.',
        resolvedAt: new Date().toISOString(),
      };

      const resolveSpy = vi
        .spyOn(alertCenterService, 'resolveAlert')
        .mockReturnValue(of(resolvedTarget));

      const updatedKpis: AlertKpis = {
        ...mockKpis,
        criticalCount: 1,
        resolvedCount: 2,
      };
      const kpisSpy = vi
        .spyOn(alertCenterService, 'getKpis')
        .mockReturnValue(of(updatedKpis));

      component.openResolveModal(targetAlert);
      component.resolutionNotes.set('Pilot berth authorization issued.');

      component.confirmResolution();

      expect(resolveSpy).toHaveBeenCalledWith(
        'alert-crit-1',
        'Pilot berth authorization issued.'
      );
      expect(kpisSpy).toHaveBeenCalled();

      // Check updated alert in signals
      const updatedInList = component
        .alerts()
        .find((a) => a.id === 'alert-crit-1');
      expect(updatedInList?.status).toBe('RESOLVED');
      expect(updatedInList?.resolutionNotes).toBe(
        'Pilot berth authorization issued.'
      );

      // Check KPIs updated
      expect(component.kpis()?.criticalCount).toBe(1);
      expect(component.kpis()?.resolvedCount).toBe(2);

      // Modal closed
      expect(component.resolvingAlert()).toBeNull();
      expect(component.isResolving()).toBe(false);
    });
  });

  describe('Bilingual support', () => {
    it('should switch labels and priority badges when language toggles to en', () => {
      languageService.setLanguage('en');
      fixture.detectChanges();

      expect(component.getFilterLabel('ALL')).toBe('All Alerts');
      expect(component.getFilterLabel('CRITICAL')).toBe('Critical (P1)');
      expect(component.getSeverityLabel('CRITICAL')).toBe('P1 - CRITICAL');
      expect(component.getSeverityLabel('HIGH')).toBe('P2 - HIGH');

      const pastDeadline = new Date(Date.now() - 60000).toISOString();
      const countdown = component.getCountdown(pastDeadline);
      expect(countdown.text).toBe('BREACHED');
    });

    it('should switch labels and priority badges when language is es', () => {
      languageService.setLanguage('es');
      fixture.detectChanges();

      expect(component.getFilterLabel('ALL')).toBe('Todas las Alertas');
      expect(component.getFilterLabel('CRITICAL')).toBe('Críticas (P1)');
      expect(component.getSeverityLabel('CRITICAL')).toBe('P1 - CRÍTICO');
      expect(component.getSeverityLabel('HIGH')).toBe('P2 - ELEVADO');

      const pastDeadline = new Date(Date.now() - 60000).toISOString();
      const countdown = component.getCountdown(pastDeadline);
      expect(countdown.text).toBe('INCUMPLIDO');
    });
  });
});
