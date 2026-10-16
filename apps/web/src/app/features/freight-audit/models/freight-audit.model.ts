export type StageType =
  | 'ORIGIN_HANDLING'
  | 'TRANSIT_1'
  | 'CUSTOMS_BORDER'
  | 'TRANSIT_2'
  | 'FINAL_DESTINATION';

export type StageStatus = 'PENDING' | 'APPROVED' | 'DISPUTED';

export interface FreightStage {
  id: string;
  shipmentId: string;
  stageType: StageType;
  stageOrder: number;
  contractedCost: number;
  actualCost: number;
  variance: number;
  variancePercent: number;
  currency: string;
  status: StageStatus;
  auditNotes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StageBreakdown {
  stageType: StageType;
  stageCount: number;
  totalContractedCost: number;
  totalActualCost: number;
  totalVariance: number;
  variancePercentage: number;
  disputedStagesCount: number;
}

export interface FreightAuditSummary {
  totalContractedCost: number;
  totalActualCost: number;
  totalVariance: number;
  variancePercentage: number;
  disputedStagesCount: number;
  stageBreakdown: StageBreakdown[];
  breakdown?: StageBreakdown[];
}

export interface UpdateStageAuditPayload {
  actualCost: number;
  auditNotes?: string;
  status?: StageStatus;
}
