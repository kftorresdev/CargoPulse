import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FreightAuditComponent } from './freight-audit.component';
import { FreightAuditService } from './services/freight-audit.service';
import {
  FreightAuditSummary,
  FreightStage,
} from './models/freight-audit.model';

describe('FreightAuditComponent', () => {
  let component: FreightAuditComponent;
  let fixture: ComponentFixture<FreightAuditComponent>;
  let serviceMock: {
    getSummary: ReturnType<typeof vi.fn>;
    getShipmentAudit: ReturnType<typeof vi.fn>;
    updateStageAudit: ReturnType<typeof vi.fn>;
    exportExcel: ReturnType<typeof vi.fn>;
  };

  const mockStages: FreightStage[] = [
    {
      id: 'stage-1',
      shipmentId: 'CP-2026-X9810',
      stageType: 'ORIGIN_HANDLING',
      stageOrder: 1,
      contractedCost: 1200,
      actualCost: 1200,
      variance: 0,
      variancePercent: 0,
      currency: 'USD',
      status: 'APPROVED',
      auditNotes: 'Verified origin drayage',
    },
    {
      id: 'stage-2',
      shipmentId: 'CP-2026-X9810',
      stageType: 'TRANSIT_1',
      stageOrder: 2,
      contractedCost: 4500,
      actualCost: 4850,
      variance: 350,
      variancePercent: 7.78,
      currency: 'USD',
      status: 'DISPUTED',
      auditNotes: 'Surcharge disputed',
    },
    {
      id: 'stage-3',
      shipmentId: 'CP-2026-X9810',
      stageType: 'CUSTOMS_BORDER',
      stageOrder: 3,
      contractedCost: 850,
      actualCost: 870,
      variance: 20,
      variancePercent: 2.35,
      currency: 'USD',
      status: 'PENDING',
      auditNotes: 'Standard customs pass',
    },
    {
      id: 'stage-4',
      shipmentId: 'CP-2026-X9810',
      stageType: 'TRANSIT_2',
      stageOrder: 4,
      contractedCost: 1600,
      actualCost: 1600,
      variance: 0,
      variancePercent: 0,
      currency: 'USD',
      status: 'PENDING',
      auditNotes: null,
    },
    {
      id: 'stage-5',
      shipmentId: 'CP-2026-X9810',
      stageType: 'FINAL_DESTINATION',
      stageOrder: 5,
      contractedCost: 750,
      actualCost: 750,
      variance: 0,
      variancePercent: 0,
      currency: 'USD',
      status: 'PENDING',
      auditNotes: null,
    },
  ];

  const mockSummary: FreightAuditSummary = {
    totalContractedCost: 8900,
    totalActualCost: 9270,
    totalVariance: 370,
    variancePercentage: 4.16,
    disputedStagesCount: 1,
    stageBreakdown: [],
  };

  beforeEach(async () => {
    localStorage.clear();
    serviceMock = {
      getSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getShipmentAudit: vi.fn().mockReturnValue(of(mockStages)),
      updateStageAudit: vi.fn().mockImplementation((id, payload) =>
        of({
          ...mockStages.find((s) => s.id === id)!,
          actualCost: payload.actualCost,
          variance: payload.actualCost - 4500,
          variancePercent: ((payload.actualCost - 4500) / 4500) * 100,
          status: payload.status ?? 'APPROVED',
          auditNotes: payload.auditNotes,
        })
      ),
      exportExcel: vi.fn().mockReturnValue(of(new Blob(['test']))),
    };

    await TestBed.configureTestingModule({
      imports: [FreightAuditComponent],
      providers: [{ provide: FreightAuditService, useValue: serviceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(FreightAuditComponent);
    component = fixture.componentInstance;
    component.languageService.setLanguage('es');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default shipment and load summary and stages on ngOnInit', () => {
    expect(component.selectedShipmentId()).toBe('CP-2026-X9810');
    expect(serviceMock.getSummary).toHaveBeenCalled();
    expect(serviceMock.getShipmentAudit).toHaveBeenCalledWith('CP-2026-X9810');
    expect(component.stages().length).toBe(5);
    expect(component.summary()).toEqual(mockSummary);
  });

  describe('Financial Metric Signals', () => {
    it('should correctly compute totalContracted', () => {
      // 1200 + 4500 + 850 + 1600 + 750 = 8900
      expect(component.totalContracted()).toBe(8900);
    });

    it('should correctly compute totalActual', () => {
      // 1200 + 4850 + 870 + 1600 + 750 = 9270
      expect(component.totalActual()).toBe(9270);
    });

    it('should correctly compute totalVariance and variancePercent', () => {
      // 9270 - 8900 = 370
      expect(component.totalVariance()).toBe(370);
      // (370 / 8900) * 100 = 4.157... -> 4.16%
      expect(component.variancePercent()).toBe(4.16);
    });

    it('should correctly identify disputed stages and count', () => {
      expect(component.isDisputed()).toBe(true);
      expect(component.disputedCount()).toBe(1);

      // If we mark all as APPROVED
      const approvedStages = mockStages.map((s) => ({
        ...s,
        status: 'APPROVED' as const,
      }));
      component.stages.set(approvedStages);

      expect(component.isDisputed()).toBe(false);
      expect(component.disputedCount()).toBe(0);
    });
  });

  describe('Chromatic Variance Indicators', () => {
    it('should return emerald green for variance <= 0%', () => {
      const clsZero = component.getVarianceBadgeClass(0);
      expect(clsZero).toContain('text-emerald-400');
      expect(clsZero).toContain('border-emerald-500/30');

      const clsNegative = component.getVarianceBadgeClass(-2.5);
      expect(clsNegative).toContain('text-emerald-400');
    });

    it('should return amber for 0% < variance <= 5%', () => {
      const clsAmber = component.getVarianceBadgeClass(3.2);
      expect(clsAmber).toContain('text-amber-400');
      expect(clsAmber).toContain('border-amber-500/30');

      const clsBoundary = component.getVarianceBadgeClass(5.0);
      expect(clsBoundary).toContain('text-amber-400');
    });

    it('should return rose red for variance > 5%', () => {
      const clsRose = component.getVarianceBadgeClass(5.01);
      expect(clsRose).toContain('text-rose-400');
      expect(clsRose).toContain('border-rose-500/30');

      const clsLarge = component.getVarianceBadgeClass(25);
      expect(clsLarge).toContain('text-rose-400');
    });
  });

  describe('Status Badge Styling', () => {
    it('should return correct badge styling for stage status', () => {
      expect(component.getStatusBadgeClass('APPROVED')).toContain('text-emerald-400');
      expect(component.getStatusBadgeClass('DISPUTED')).toContain('text-rose-400');
      expect(component.getStatusBadgeClass('PENDING')).toContain('text-sky-400');
    });
  });

  describe('Stage Type Labels', () => {
    it('should map stage types to human-readable labels in Spanish and English', () => {
      expect(component.getStageLabel('ORIGIN_HANDLING')).toBe('Arrastre de Origen');
      expect(component.getStageLabel('TRANSIT_1')).toBe('Tránsito Internacional 1');
      expect(component.getStageLabel('CUSTOMS_BORDER')).toBe(
        'Despacho Aduanal y Cruce Fronterizo'
      );
      expect(component.getStageLabel('TRANSIT_2')).toBe('Tránsito Internacional 2');
      expect(component.getStageLabel('FINAL_DESTINATION')).toBe('Entrega de Última Milla');

      component.languageService.setLanguage('en');
      expect(component.getStageLabel('ORIGIN_HANDLING')).toBe('Origin Drayage');
      expect(component.getStageLabel('TRANSIT_1')).toBe('International Transit 1');
      expect(component.getStageLabel('CUSTOMS_BORDER')).toBe(
        'Customs Clearance & Border Crossing'
      );
      expect(component.getStageLabel('TRANSIT_2')).toBe('International Transit 2');
      expect(component.getStageLabel('FINAL_DESTINATION')).toBe('Final Mile Delivery');
    });
  });

  describe('Shipment Selection', () => {
    it('should change active shipment and fetch its stages', () => {
      component.selectShipment('CP-2026-E4421');

      expect(component.selectedShipmentId()).toBe('CP-2026-E4421');
      expect(serviceMock.getShipmentAudit).toHaveBeenCalledWith('CP-2026-E4421');
    });
  });

  describe('Excel Export', () => {
    it('should call freightAuditService.exportExcel and toggle exporting state', () => {
      expect(component.isExporting()).toBe(false);

      component.exportExcel();

      expect(serviceMock.exportExcel).toHaveBeenCalled();
      expect(component.isExporting()).toBe(false);
    });
  });

  describe('Audit Adjustment Modal & Live Preview', () => {
    it('should open edit modal with populated values', () => {
      const targetStage = mockStages[1]; // Transit 1, actualCost 4850, status DISPUTED
      component.openEditModal(targetStage);

      expect(component.editingStage()).toEqual(targetStage);
      expect(component.auditForm.controls.actualCost.value).toBe(4850);
      expect(component.previewActualCost()).toBe(4850);
      expect(component.previewStatus()).toBe('DISPUTED');
    });

    it('should close edit modal', () => {
      component.openEditModal(mockStages[0]);
      expect(component.editingStage()).toBeTruthy();

      component.closeEditModal();
      expect(component.editingStage()).toBeNull();
    });

    it('should calculate live variance preview when actualCost input changes', () => {
      const targetStage = mockStages[1]; // Contracted: 4500
      component.openEditModal(targetStage);

      // Change cost to 4600 (+100, +2.22%)
      component.auditForm.controls.actualCost.setValue(4600);
      component.onCostInputChange();

      expect(component.previewVariance()).toBe(100);
      expect(component.previewVariancePercent()).toBe(2.22);
      // Not > 5% and not <= 0%, keeps stage status or pending
      expect(component.previewStatus()).toBe('DISPUTED');

      // Change cost to 4500 (0 variance -> <= 0%)
      component.auditForm.controls.actualCost.setValue(4500);
      component.onCostInputChange();

      expect(component.previewVariance()).toBe(0);
      expect(component.previewVariancePercent()).toBe(0);
      expect(component.previewStatus()).toBe('APPROVED');

      // Change cost to 5000 (+500, +11.11% -> > 5%)
      component.auditForm.controls.actualCost.setValue(5000);
      component.onCostInputChange();

      expect(component.previewVariance()).toBe(500);
      expect(component.previewVariancePercent()).toBe(11.11);
      expect(component.previewStatus()).toBe('DISPUTED');
    });

    it('should save adjustment and update stage list and reload summary', () => {
      const targetStage = mockStages[1];
      component.openEditModal(targetStage);

      component.auditForm.setValue({
        actualCost: 4500,
        auditNotes: 'Agreed credit adjustment',
        status: 'APPROVED',
      });

      component.saveAdjustment();

      expect(serviceMock.updateStageAudit).toHaveBeenCalledWith(
        'stage-2',
        {
          actualCost: 4500,
          auditNotes: 'Agreed credit adjustment',
          status: 'APPROVED',
        }
      );

      // Verify stages signal updated
      const updatedStage = component.stages().find((s) => s.id === 'stage-2');
      expect(updatedStage?.actualCost).toBe(4500);
      expect(updatedStage?.status).toBe('APPROVED');

      // Modal closed
      expect(component.editingStage()).toBeNull();
      // Summary reloaded
      expect(serviceMock.getSummary).toHaveBeenCalledTimes(2);
    });

    it('should not save if form is invalid or editingStage is null', () => {
      component.editingStage.set(null);
      component.saveAdjustment();
      expect(serviceMock.updateStageAudit).not.toHaveBeenCalled();

      component.openEditModal(mockStages[0]);
      component.auditForm.controls.actualCost.setValue(-100); // Invalid (min 0)
      component.saveAdjustment();
      expect(serviceMock.updateStageAudit).not.toHaveBeenCalled();
    });
  });

  describe('UI Template Elements', () => {
    it('should render the 4 KPI cards with currency formatting in Spanish and English', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const kpiCards = compiled.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 > div');
      expect(kpiCards.length).toBe(4);

      // Total Contracted
      expect(kpiCards[0].textContent).toContain('$8,900.00');
      // Total Actual Billed
      expect(kpiCards[1].textContent).toContain('$9,270.00');
      // Net Variance
      expect(kpiCards[2].textContent).toContain('+$370.00');
      // Disputed count (Spanish default)
      expect(kpiCards[3].textContent).toContain('1');
      expect(kpiCards[3].textContent).toContain('Disputa Activa');

      component.languageService.setLanguage('en');
      fixture.detectChanges();
      expect(kpiCards[3].textContent).toContain('Dispute Active');
    });

    it('should render 5 table rows for the 5-leg stages in Spanish and English', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('tbody tr');
      expect(rows.length).toBe(5);

      // Check first row (Origin Drayage in Spanish default)
      expect(rows[0].textContent).toContain('Arrastre de Origen');
      expect(rows[0].textContent).toContain('MANEJO_ORIGEN');
      expect(rows[0].textContent).toContain('$1,200.00');
      expect(rows[0].textContent).toContain('APROBADO');

      // Check second row (Transit 1 in Spanish default)
      expect(rows[1].textContent).toContain('Tránsito Internacional 1');
      expect(rows[1].textContent).toContain('EN DISPUTA');
      expect(rows[1].textContent).toContain('+7.78%');

      // When switched to English
      component.languageService.setLanguage('en');
      fixture.detectChanges();
      expect(rows[0].textContent).toContain('Origin Drayage');
      expect(rows[0].textContent).toContain('ORIGIN_HANDLING');
      expect(rows[0].textContent).toContain('APPROVED');
      expect(rows[1].textContent).toContain('International Transit 1');
      expect(rows[1].textContent).toContain('DISPUTED');
    });

    it('should translate shipment subtitles, stage codes, and default seed audit notes while keeping custom notes verbatim', () => {
      component.languageService.setLanguage('es');
      expect(component.getShipmentSubtitle('CP-2026-X9810')).toBe('Marítimo / Retención Aduanal');
      expect(component.getShipmentSubtitle('CP-2026-E4421')).toBe('Varianza de Chasis');
      expect(component.getShipmentSubtitle('CP-2026-A1092')).toBe('Carga Aérea Limpia');
      expect(component.getStatusLabel('APPROVED')).toBe('APROBADO');
      expect(component.getStatusLabel('DISPUTED')).toBe('EN DISPUTA');
      expect(component.getStatusLabel('PENDING')).toBe('PENDIENTE');
      expect(component.getStageCodeLabel('ORIGIN_HANDLING')).toBe('MANEJO_ORIGEN');
      expect(
        component.formatAuditNote('Export documentation and container drayage verified.')
      ).toBe('Documentación de exportación y arrastre de contenedor verificados.');
      expect(component.formatAuditNote('Custom user audit note')).toBe('Custom user audit note');

      component.languageService.setLanguage('en');
      expect(component.getShipmentSubtitle('CP-2026-X9810')).toBe('Ocean / Customs Hold');
      expect(component.getStatusLabel('APPROVED')).toBe('APPROVED');
      expect(component.getStageCodeLabel('ORIGIN_HANDLING')).toBe('ORIGIN_HANDLING');
      expect(
        component.formatAuditNote('Export documentation and container drayage verified.')
      ).toBe('Export documentation and container drayage verified.');
    });

    it('should render the Export to Excel button and trigger export on click', () => {
      const exportSpy = vi.spyOn(component, 'exportExcel');
      const compiled = fixture.nativeElement as HTMLElement;
      const exportBtn = Array.from(compiled.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Exportar a Excel') || b.textContent?.includes('Export to Excel')
      );

      expect(exportBtn).toBeTruthy();
      exportBtn?.click();
      expect(exportSpy).toHaveBeenCalled();
    });
  });
});
