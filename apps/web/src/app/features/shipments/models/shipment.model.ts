export interface ShipmentItem {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrierName: string;
  status: string;
  estimatedDelivery: string;
  alertsCount?: number;
  stagesCount?: number;
  currentStatus?: string;
  eta?: string;
}

export interface PaginatedShipments {
  items: ShipmentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NoteAuthorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface NoteTreeNode {
  id: string;
  shipmentId: string;
  authorId: string;
  author: NoteAuthorSummary;
  parentId: string | null;
  content: string;
  attachmentUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  replies: NoteTreeNode[];
}

export interface CreateNotePayload {
  content: string;
  parentId?: string | null;
  attachmentUrl?: string | null;
}

export interface CreateShipmentPayload {
  trackingNumber: string;
  origin: string;
  destination: string;
  carrierName: string;
  eta?: string;
  stages?: any[];
}
