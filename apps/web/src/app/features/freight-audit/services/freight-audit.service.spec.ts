import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FreightAuditService } from './freight-audit.service';
import {
  FreightAuditSummary,
  FreightStage,
} from '../models/freight-audit.model';

describe('FreightAuditService', () => {
  let service: FreightAuditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FreightAuditService],
    });

    service = TestBed.inject(FreightAuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSummary', () => {
    it('should return API summary when HTTP call succeeds', () => {
      const mockSummary: Partial<FreightAuditSummary> = {
        totalContractedCost: 31750,
        totalActualCost: 33850,
        totalVariance: 2100,
        variancePercentage: 6.61,
        disputedStagesCount: 2,
        stageBreakdown: [],
      };

      let result: FreightAuditSummary | undefined;
      service.getSummary().subscribe((summary) => {
        result = summary;
      });

      const req = httpMock.expectOne('/api/freight-audit/summary');
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);

      expect(result).toBeDefined();
      expect(result?.totalContractedCost).toBe(31750);
      expect(result?.disputedStagesCount).toBe(2);
    });

    it('should return fallback summary if HTTP call fails', () => {
      let result: FreightAuditSummary | undefined;
      service.getSummary().subscribe((summary) => {
        result = summary;
      });

      const req = httpMock.expectOne('/api/freight-audit/summary');
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      expect(result).toBeDefined();
      expect(result?.totalContractedCost).toBeGreaterThan(0);
      expect(result?.stageBreakdown.length).toBe(5);
    });
  });

  describe('getShipmentAudit', () => {
    it('should return stages from API when available', () => {
      const mockStages: FreightStage[] = [
        {
          id: 's1',
          shipmentId: 'CP-2026-X9810',
          stageType: 'ORIGIN_HANDLING',
          stageOrder: 1,
          contractedCost: 1200,
          actualCost: 1200,
          variance: 0,
          variancePercent: 0,
          currency: 'USD',
          status: 'APPROVED',
          auditNotes: null,
        },
      ];

      let result: FreightStage[] | undefined;
      service.getShipmentAudit('CP-2026-X9810').subscribe((stages) => {
        result = stages;
      });

      const req = httpMock.expectOne(
        '/api/freight-audit/shipment/CP-2026-X9810'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockStages);

      expect(result?.length).toBe(1);
      expect(result?.[0].id).toBe('s1');
    });

    it('should return seed fallback stages when API returns error', () => {
      let result: FreightStage[] | undefined;
      service.getShipmentAudit('CP-2026-X9810').subscribe((stages) => {
        result = stages;
      });

      const req = httpMock.expectOne(
        '/api/freight-audit/shipment/CP-2026-X9810'
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(result).toBeDefined();
      expect(result?.length).toBe(5);
      expect(result?.[0].stageOrder).toBe(1);
      expect(result?.[1].stageType).toBe('TRANSIT_1');
    });
  });

  describe('updateStageAudit', () => {
    it('should send PATCH request with payload', () => {
      const payload = {
        actualCost: 4600,
        auditNotes: 'Negotiated discount',
        status: 'APPROVED' as const,
      };

      const mockResponse: FreightStage = {
        id: 'stage-x9810-2',
        shipmentId: 'CP-2026-X9810',
        stageType: 'TRANSIT_1',
        stageOrder: 2,
        contractedCost: 4500,
        actualCost: 4600,
        variance: 100,
        variancePercent: 2.22,
        currency: 'USD',
        status: 'APPROVED',
        auditNotes: 'Negotiated discount',
      };

      let result: FreightStage | undefined;
      service
        .updateStageAudit('stage-x9810-2', payload)
        .subscribe((updated) => {
          result = updated;
        });

      const req = httpMock.expectOne('/api/freight-audit/stage/stage-x9810-2');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      expect(result?.actualCost).toBe(4600);
      expect(result?.variance).toBe(100);
    });

    it('should calculate local update and apply auto-status on HTTP error', () => {
      const payload = {
        actualCost: 5000,
        auditNotes: 'Higher fuel surcharge',
      };

      let result: FreightStage | undefined;
      service
        .updateStageAudit('stage-x9810-2', payload)
        .subscribe((updated) => {
          result = updated;
        });

      const req = httpMock.expectOne('/api/freight-audit/stage/stage-x9810-2');
      req.flush('Error', { status: 500, statusText: 'Internal Error' });

      expect(result).toBeDefined();
      expect(result?.actualCost).toBe(5000);
      expect(result?.variance).toBe(500); // 5000 - 4500
      expect(result?.variancePercent).toBe(11.11);
      expect(result?.status).toBe('DISPUTED');
    });
  });

  describe('exportExcel', () => {
    it('should request blob from API and trigger download', () => {
      const spyTrigger = vi.spyOn(service, 'triggerBlobDownload').mockImplementation(() => {});
      const mockBlob = new Blob(['mock binary'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      service.exportExcel().subscribe();

      const req = httpMock.expectOne('/api/freight-audit/export/excel');
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);

      expect(spyTrigger).toHaveBeenCalledWith(
        mockBlob,
        'freight-audit-report.xlsx'
      );
    });

    it('should fall back to generated blob if export endpoint fails', () => {
      const spyTrigger = vi.spyOn(service, 'triggerBlobDownload').mockImplementation(() => {});

      let returnedBlob: Blob | undefined;
      service.exportExcel().subscribe((blob) => {
        returnedBlob = blob;
      });

      const req = httpMock.expectOne('/api/freight-audit/export/excel');
      req.error(new ProgressEvent('error'));

      expect(returnedBlob).toBeDefined();
      expect(spyTrigger).toHaveBeenCalled();
    });
  });
});
