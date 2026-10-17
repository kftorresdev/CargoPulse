export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type AlertFilterType = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPEN' | 'RESOLVED';

export interface OperationalAlert {
  id: string;
  shipmentId: string;
  shipmentTracking: string;
  carrier: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  slaDeadline: string | Date;
  slaRemaining: string;
  financialImpactUsd: number;
  resolutionNotes?: string | null;
  resolvedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface AlertKpis {
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openCount: number;
  resolvedCount: number;
  totalFinancialImpactUsd: number;
  slaBreachedCount: number;
}

export interface AlertQuery {
  status?: AlertStatus;
  severity?: AlertSeverity;
}

export interface ResolveAlertPayload {
  resolutionNotes: string;
}
