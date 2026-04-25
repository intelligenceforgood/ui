export interface DiscoveryRow {
  discoveryId: string;
  domain: string;
  seenAt: string;
  source: string;
  filterMatch: boolean;
  filterReason?: string | null;
  enqueuedScanId?: string | null;
  dismissedAt?: string | null;
  dismissReason?: string | null;
}

export interface DiscoveryList {
  items: DiscoveryRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface EnqueueResponse {
  discoveryId: string;
  enqueuedScanId: string;
}

export interface DismissRequest {
  reason?: string;
}
