export interface Campaign {
  id: string;
  name: string;
  description?: string;
  taxonomy_labels?: Record<string, unknown>;
  taxonomy_rollup: string[];
}

export interface CreateCampaignPayload {
  name: string;
  description: string;
  taxonomy_labels: Record<string, unknown>;
  associated_taxonomy_ids: string[];
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  taxonomy_labels?: Record<string, unknown>;
  associated_taxonomy_ids?: string[];
}
