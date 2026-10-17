import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AlertCenterService } from './alert-center.service';
import { AlertKpis, OperationalAlert } from '../models/alert.model';

describe('AlertCenterService', () => {
  let service: AlertCenterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AlertCenterService,
      ],
    });

    service = TestBed.inject(AlertCenterService);
    httpMock = TestBed.inject(HttpTestingController);
    service.resetDemoAlerts();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  describe('getKpis()', () => {
    it('should fetch and unwrap KPIs from GET /api/alerts/kpis when HTTP succeeds', () => {
      const mockKpis: AlertKpis = {
        totalAlerts: 10,
        criticalCount: 2,
        highCount: 3,
        mediumCount: 4,
        lowCount: 1,
        openCount: 5,
        resolvedCount: 5,
        totalFinancialImpactUsd: 4500,
        slaBreachedCount: 1,
      };

      let result: AlertKpis | undefined;
      service.getKpis().subscribe((kpis) => {
        result = kpis;
      });

      const req = httpMock.expectOne('/api/alerts/kpis');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockKpis });

      expect(result).toEqual(mockKpis);
    });

    it('should fallback to computed demo KPIs when HTTP error occurs', () => {
      let result: AlertKpis | undefined;
      service.getKpis().subscribe((kpis) => {
        result = kpis;
      });

      const req = httpMock.expectOne('/api/alerts/kpis');
      req.error(new ProgressEvent('Network error'));

      expect(result).toBeDefined();
      expect(result!.totalAlerts).toBeGreaterThan(0);
      expect(result!.criticalCount).toBeGreaterThan(0);
      expect(typeof result!.totalFinancialImpactUsd).toBe('number');
    });

    it('should handle payload without data wrapping', () => {
      const mockKpis: AlertKpis = {
        totalAlerts: 7,
        criticalCount: 1,
        highCount: 2,
        mediumCount: 2,
        lowCount: 2,
        openCount: 3,
        resolvedCount: 4,
        totalFinancialImpactUsd: 1200,
        slaBreachedCount: 0,
      };

      let result: AlertKpis | undefined;
      service.getKpis().subscribe((kpis) => {
        result = kpis;
      });

      const req = httpMock.expectOne('/api/alerts/kpis');
      req.flush(mockKpis);

      expect(result).toEqual(mockKpis);
    });
  });

  describe('getAlerts()', () => {
    it('should fetch alerts from GET /api/alerts when HTTP succeeds', () => {
      const mockAlerts: Partial<OperationalAlert>[] = [
        {
          id: 'test-1',
          shipmentTracking: 'CP-TEST-1',
          severity: 'CRITICAL',
          status: 'OPEN',
        },
      ];

      let result: OperationalAlert[] | undefined;
      service.getAlerts().subscribe((alerts) => {
        result = alerts;
      });

      const req = httpMock.expectOne('/api/alerts');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockAlerts });

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('test-1');
    });

    it('should pass status and severity query parameters', () => {
      service.getAlerts({ status: 'OPEN', severity: 'CRITICAL' }).subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/alerts' &&
          r.params.get('status') === 'OPEN' &&
          r.params.get('severity') === 'CRITICAL'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should fallback to in-memory alerts on HTTP error', () => {
      let result: OperationalAlert[] | undefined;
      service.getAlerts().subscribe((alerts) => {
        result = alerts;
      });

      const req = httpMock.expectOne('/api/alerts');
      req.error(new ProgressEvent('Network error'));

      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThan(0);
      expect(result![0].shipmentTracking).toBeDefined();
    });

    it('should filter fallback demo alerts by severity', () => {
      let result: OperationalAlert[] | undefined;
      service.getAlerts({ severity: 'CRITICAL' }).subscribe((alerts) => {
        result = alerts;
      });

      const req = httpMock.expectOne((r) => r.url === '/api/alerts');
      req.error(new ProgressEvent('Network error'));

      expect(result).toBeDefined();
      expect(result!.every((a) => a.severity === 'CRITICAL')).toBe(true);
    });

    it('should filter fallback demo alerts by status', () => {
      let result: OperationalAlert[] | undefined;
      service.getAlerts({ status: 'RESOLVED' }).subscribe((alerts) => {
        result = alerts;
      });

      const req = httpMock.expectOne((r) => r.url === '/api/alerts');
      req.error(new ProgressEvent('Network error'));

      expect(result).toBeDefined();
      expect(result!.every((a) => a.status === 'RESOLVED')).toBe(true);
    });
  });

  describe('resolveAlert()', () => {
    it('should call PATCH /api/alerts/:id/resolve with payload and update local cache', () => {
      const updatedAlert: Partial<OperationalAlert> = {
        id: 'alert-1',
        status: 'RESOLVED',
        resolutionNotes: 'Verified with carrier dispatch.',
      };

      let result: OperationalAlert | undefined;
      service
        .resolveAlert('alert-1', 'Verified with carrier dispatch.')
        .subscribe((alert) => {
          result = alert;
        });

      const req = httpMock.expectOne('/api/alerts/alert-1/resolve');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        resolutionNotes: 'Verified with carrier dispatch.',
      });
      req.flush({ data: updatedAlert });

      expect(result?.status).toBe('RESOLVED');
    });

    it('should fallback gracefully on HTTP error and mark local alert as RESOLVED', () => {
      let result: OperationalAlert | undefined;
      service
        .resolveAlert('alert-1', 'Manual offline clearance applied.')
        .subscribe((alert) => {
          result = alert;
        });

      const req = httpMock.expectOne('/api/alerts/alert-1/resolve');
      req.error(new ProgressEvent('Network error'));

      expect(result).toBeDefined();
      expect(result!.id).toBe('alert-1');
      expect(result!.status).toBe('RESOLVED');
      expect(result!.resolutionNotes).toBe('Manual offline clearance applied.');
      expect(result!.resolvedAt).toBeDefined();

      // Check that in-memory snapshot reflects the change
      const snapshot = service.getDemoAlertsSnapshot();
      const updated = snapshot.find((a) => a.id === 'alert-1');
      expect(updated?.status).toBe('RESOLVED');
    });
  });

  describe('calculateSlaRemaining()', () => {
    it('should return BREACHED for a deadline in the past', () => {
      const past = new Date(Date.now() - 60000);
      const res = service.calculateSlaRemaining(past);
      expect(res).toBe('BREACHED');
    });

    it('should return HH:MM:SS format for future deadline', () => {
      const future = new Date(Date.now() + 3665 * 1000); // 1h 1m 5s
      const res = service.calculateSlaRemaining(future);
      expect(res).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(res).toBe('01:01:05');
    });
  });

  describe('computeKpis()', () => {
    it('should accurately aggregate metrics over given alert dataset', () => {
      const alerts: OperationalAlert[] = [
        {
          id: '1',
          shipmentId: 's1',
          shipmentTracking: 'TRK-1',
          carrier: 'Carrier 1',
          title: 'Alert 1',
          description: 'Desc 1',
          severity: 'CRITICAL',
          status: 'OPEN',
          slaDeadline: new Date(Date.now() - 1000).toISOString(),
          slaRemaining: 'BREACHED',
          financialImpactUsd: 1000,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          shipmentId: 's2',
          shipmentTracking: 'TRK-2',
          carrier: 'Carrier 2',
          title: 'Alert 2',
          description: 'Desc 2',
          severity: 'HIGH',
          status: 'RESOLVED',
          slaDeadline: new Date(Date.now() + 100000).toISOString(),
          slaRemaining: '01:00:00',
          financialImpactUsd: 500,
          createdAt: new Date().toISOString(),
        },
      ];

      const kpis = service.computeKpis(alerts);
      expect(kpis.totalAlerts).toBe(2);
      expect(kpis.criticalCount).toBe(1);
      expect(kpis.highCount).toBe(1);
      expect(kpis.openCount).toBe(1);
      expect(kpis.resolvedCount).toBe(1);
      expect(kpis.totalFinancialImpactUsd).toBe(1000); // Excludes resolved
      expect(kpis.slaBreachedCount).toBe(1);
    });
  });
});
