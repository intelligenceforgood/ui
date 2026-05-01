export interface ThreatActorRow {
  actorId: string;
  displayName: string;
  role?: string;
  campaignId?: string;
  realName?: string;
  confidence?: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ActorListResponse {
  items: ThreatActorRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActorIdentityEdge {
  sourceIdentityId: string;
  targetIdentityId: string;
  edgeType: string;
}

export interface ActorIdentityRow {
  identityId: string;
  platform: string;
  handle: string;
  metadata?: Record<string, unknown>;
}

export interface LeakRecordRow {
  leakId: string;
  sourceBreach: string;
  passwordCleartext?: string;
  email?: string;
}

export interface ActorDetailResponse {
  actor: ThreatActorRow;
  identities: ActorIdentityRow[];
  edges: ActorIdentityEdge[];
  leaks: LeakRecordRow[];
  chats: ChatSessionRow[];
  damage: DamageRow[];
  brands: BrandRow[];
  linkedCampaigns: string[];
}

export interface ChatSessionRow {
  sessionId: string;
  transcript?: string;
}

export interface DamageRow {
  currency: string;
  claimed_amount?: number;
  confirmed_amount?: number;
}

export interface BrandRow {
  brand: string;
}
