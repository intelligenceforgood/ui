export type SavedSearchDescriptor = {
  id?: string;
  name?: string;
  owner?: string | null;
  tags: string[];
};

export type SearchHistoryEvent = {
  id: string;
  actor: string;
  createdAt: string;
  params: Record<string, unknown>;
  query?: string;
  classification?: string;
  caseId?: string;
  resultCount?: number;
  total?: number;
  savedSearch?: SavedSearchDescriptor | null;
};

export type SavedSearchRecord = {
  id: string;
  name: string;
  owner?: string | null;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  params: Record<string, unknown>;
};

export type HybridSearchSchema = {
  indicatorTypes: string[];
  datasets: string[];
  classifications: string[];
  lossBuckets: string[];
  timePresets: string[];
  entityExamples: Record<string, string[]>;
};
