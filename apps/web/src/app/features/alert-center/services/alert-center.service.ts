import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AlertKpis,
  AlertQuery,
  OperationalAlert,
  ResolveAlertPayload,
} from '../models/alert.model';

@Injectable({
  providedIn: 'root',
})
export class AlertCenterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/alerts';

  // Seed demo alerts for resilient offline demonstration and fallback
  private inMemoryAlerts: OperationalAlert[] = this.createInitialDemoAlerts();

  /**
   * Helper method to calculate dynamic SLA countdown or breach status.
   * Format: 'HH:MM:SS' or 'BREACHED' if expired.
   */
  calculateSlaRemaining(slaDeadline: Date | string, now: number = Date.now()): string {
    const deadlineTime = new Date(slaDeadline).getTime();
    const diffMs = deadlineTime - now;

    if (diffMs <= 0) {
      return 'BREACHED';
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Retrieves aggregated KPI metrics for the operational alert center.
   * Calls GET /api/alerts/kpis and falls back to dynamic in-memory calculation.
   */
  getKpis(): Observable<AlertKpis> {
    return this.http
      .get<AlertKpis | { data?: AlertKpis }>(`${this.apiUrl}/kpis`)
      .pipe(
        map((res) => {
          const payload = (res as any)?.data ?? res;
          if (payload && typeof payload.totalAlerts === 'number') {
            return payload as AlertKpis;
          }
          return this.computeKpis(this.inMemoryAlerts);
        }),
        catchError(() => of(this.computeKpis(this.inMemoryAlerts)))
      );
  }

  /**
   * Retrieves operational alerts matching optional status and severity query filters.
   * Calls GET /api/alerts and falls back to in-memory state.
   */
  getAlerts(query?: AlertQuery): Observable<OperationalAlert[]> {
    let params = new HttpParams();
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.severity) {
      params = params.set('severity', query.severity);
    }

    return this.http
      .get<OperationalAlert[] | { data?: OperationalAlert[] }>(this.apiUrl, {
        params,
      })
      .pipe(
        map((res) => {
          const payload = (res as any)?.data ?? res;
          if (Array.isArray(payload)) {
            this.inMemoryAlerts = [...payload];
            return payload as OperationalAlert[];
          }
          return this.getFilteredDemoAlerts(query);
        }),
        catchError(() => of(this.getFilteredDemoAlerts(query)))
      );
  }

  /**
   * Resolves an active incident with audit notes.
   * Calls PATCH /api/alerts/:id/resolve and syncs in-memory cache.
   */
  resolveAlert(
    id: string,
    resolutionNotes: string
  ): Observable<OperationalAlert> {
    const payload: ResolveAlertPayload = { resolutionNotes };

    return this.http
      .patch<OperationalAlert | { data?: OperationalAlert }>(
        `${this.apiUrl}/${id}/resolve`,
        payload
      )
      .pipe(
        map((res) => {
          const updated = ((res as any)?.data ?? res) as OperationalAlert;
          this.updateLocalAlert(updated);
          return updated;
        }),
        catchError(() => {
          const local = this.resolveLocalAlert(id, resolutionNotes);
          return of(local);
        })
      );
  }

  /**
   * Returns current snapshot of in-memory alerts (used in unit tests and local inspection).
   */
  getDemoAlertsSnapshot(): OperationalAlert[] {
    return JSON.parse(JSON.stringify(this.inMemoryAlerts));
  }

  /**
   * Resets demo alerts back to baseline seed.
   */
  resetDemoAlerts(): void {
    this.inMemoryAlerts = this.createInitialDemoAlerts();
  }

  /**
   * Recalculates KPIs over an array of alerts.
   */
  computeKpis(alerts: OperationalAlert[]): AlertKpis {
    const totalAlerts = alerts.length;
    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
    const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM').length;
    const lowCount = alerts.filter((a) => a.severity === 'LOW').length;
    const openCount = alerts.filter(
      (a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS'
    ).length;
    const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;
    const totalFinancialImpactUsd = alerts
      .filter((a) => a.status !== 'RESOLVED')
      .reduce((sum, a) => sum + (a.financialImpactUsd || 0), 0);
    const slaBreachedCount = alerts.filter((a) => {
      if (a.status === 'RESOLVED') return false;
      return new Date(a.slaDeadline).getTime() <= Date.now();
    }).length;

    return {
      totalAlerts,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      openCount,
      resolvedCount,
      totalFinancialImpactUsd,
      slaBreachedCount,
    };
  }

  private getFilteredDemoAlerts(query?: AlertQuery): OperationalAlert[] {
    const now = Date.now();
    let result = this.inMemoryAlerts.map((alert) => ({
      ...alert,
      slaRemaining: this.calculateSlaRemaining(alert.slaDeadline, now),
    }));

    if (query?.status) {
      result = result.filter((a) => a.status === query.status);
    }
    if (query?.severity) {
      result = result.filter((a) => a.severity === query.severity);
    }

    return JSON.parse(JSON.stringify(result));
  }

  private updateLocalAlert(alert: OperationalAlert): void {
    const idx = this.inMemoryAlerts.findIndex((a) => a.id === alert.id);
    if (idx !== -1) {
      this.inMemoryAlerts[idx] = { ...alert };
    } else {
      this.inMemoryAlerts.unshift({ ...alert });
    }
  }

  private resolveLocalAlert(
    id: string,
    resolutionNotes: string
  ): OperationalAlert {
    const idx = this.inMemoryAlerts.findIndex((a) => a.id === id);
    const resolvedAt = new Date().toISOString();

    if (idx !== -1) {
      const existing = this.inMemoryAlerts[idx];
      const updated: OperationalAlert = {
        ...existing,
        status: 'RESOLVED',
        resolutionNotes,
        resolvedAt,
        slaRemaining: this.calculateSlaRemaining(existing.slaDeadline),
      };
      this.inMemoryAlerts[idx] = updated;
      return JSON.parse(JSON.stringify(updated));
    }

    // Fallback if not found in list
    const fallback: OperationalAlert = {
      id,
      shipmentId: 'shp-generic',
      shipmentTracking: 'CP-2026-UNKNOWN',
      carrier: 'Carrier Express',
      title: 'Resolved Incident',
      description: 'Incident resolved successfully.',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      slaDeadline: new Date().toISOString(),
      slaRemaining: '00:00:00',
      financialImpactUsd: 0,
      resolutionNotes,
      resolvedAt,
      createdAt: new Date().toISOString(),
    };
    this.inMemoryAlerts.unshift(fallback);
    return fallback;
  }

  private createInitialDemoAlerts(): OperationalAlert[] {
    const now = Date.now();
    return [
      {
        id: 'alert-1',
        shipmentId: '550e8400-e29b-41d4-a716-446655440001',
        shipmentTracking: 'CP-2026-X9810',
        carrier: 'Maersk Line',
        title: 'Vessel Berth Delay Exceeding 18 Hours (MAERSK MC-KINNEY)',
        description:
          '340 Refrigerated Pharma Containers at risk of cold-chain deviation at Port of Rotterdam.',
        severity: 'CRITICAL',
        status: 'OPEN',
        slaDeadline: new Date(now + 38 * 60 * 1000 + 12 * 1000).toISOString(),
        slaRemaining: '00:38:12',
        financialImpactUsd: 1450.0,
        createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-2',
        shipmentId: '550e8400-e29b-41d4-a716-446655440002',
        shipmentTracking: 'CP-2026-E4421',
        carrier: 'Lufthansa Cargo',
        title: 'Missing Commercial Invoice Document for Manifest ORD-0941',
        description:
          "Air freight cargo grounded at Chicago O'Hare pending phytosanitary certificate verification.",
        severity: 'HIGH',
        status: 'OPEN',
        slaDeadline: new Date(now + 105 * 60 * 1000).toISOString(),
        slaRemaining: '01:45:00',
        financialImpactUsd: 850.0,
        createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-3',
        shipmentId: '550e8400-e29b-41d4-a716-446655440003',
        shipmentTracking: 'CP-2026-M5532',
        carrier: 'BNSF Railway',
        title: 'Intermodal Rail Well-Car Mechanical Defect',
        description:
          'Hot box detector tripped outside Fort Worth intermodal yard. Chassis transfer required.',
        severity: 'CRITICAL',
        status: 'OPEN',
        slaDeadline: new Date(now - 45 * 60 * 1000).toISOString(),
        slaRemaining: 'BREACHED',
        financialImpactUsd: 2200.0,
        createdAt: new Date(now - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-4',
        shipmentId: '550e8400-e29b-41d4-a716-446655440004',
        shipmentTracking: 'CP-2026-T7719',
        carrier: 'OceanBridge Global',
        title: 'Fuel Surcharge Variance (BAF Cap Exceeded)',
        description:
          'Carrier billed BAF surcharge of 18% exceeding the 12% contractual master service ceiling.',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        slaDeadline: new Date(now + 14 * 3600 * 1000).toISOString(),
        slaRemaining: '14:00:00',
        financialImpactUsd: 350.0,
        createdAt: new Date(now - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-5',
        shipmentId: '550e8400-e29b-41d4-a716-446655440005',
        shipmentTracking: 'CP-2026-R8890',
        carrier: 'Ferromex Freight',
        title: 'Border Customs Documentation Stamp Missing',
        description:
          'Pedimento document requires customs broker digital seal for Nuevo Laredo rail bridge crossing.',
        severity: 'LOW',
        status: 'OPEN',
        slaDeadline: new Date(now + 28 * 3600 * 1000).toISOString(),
        slaRemaining: '28:00:00',
        financialImpactUsd: 150.0,
        createdAt: new Date(now - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-6',
        shipmentId: '550e8400-e29b-41d4-a716-446655440006',
        shipmentTracking: 'CP-2026-A1092',
        carrier: 'Lufthansa Cargo',
        title: 'Temperature Excursion Sensor Warning',
        description:
          'Sensor logged +6.2°C briefly during tarmac transfer; verified within pharma buffer (2-8°C).',
        severity: 'HIGH',
        status: 'RESOLVED',
        slaDeadline: new Date(now - 48 * 3600 * 1000).toISOString(),
        slaRemaining: 'BREACHED',
        financialImpactUsd: 0.0,
        resolutionNotes:
          'Reefer unit telemetry verified. Cold chain integrity maintained throughout flight.',
        resolvedAt: new Date(now - 24 * 3600 * 1000).toISOString(),
        createdAt: new Date(now - 52 * 3600 * 1000).toISOString(),
      },
      {
        id: 'alert-7',
        shipmentId: '550e8400-e29b-41d4-a716-446655440007',
        shipmentTracking: 'CP-2026-C3341',
        carrier: 'Swift Freight',
        title: 'Unauthorized Chassis Split Drayage Fee',
        description:
          'Drayage invoice included unapproved chassis split fee of $120.',
        severity: 'LOW',
        status: 'RESOLVED',
        slaDeadline: new Date(now - 72 * 3600 * 1000).toISOString(),
        slaRemaining: 'BREACHED',
        financialImpactUsd: 120.0,
        resolutionNotes:
          'Disputed with carrier billing team. Full credit memo received and reconciled in freight audit.',
        resolvedAt: new Date(now - 40 * 3600 * 1000).toISOString(),
        createdAt: new Date(now - 80 * 3600 * 1000).toISOString(),
      },
    ];
  }
}
