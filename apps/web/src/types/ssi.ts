/**
 * SSI (Scam Site Investigator) type definitions.
 *
 * These mirror the Pydantic models from the SSI backend. Field names use
 * camelCase to match the Python models' `alias_generator = to_camel` output,
 * except where the backend returns snake_case (SSI doesn't use alias_generator).
 */

// ---------------------------------------------------------------------------
// Investigation request / response
// ---------------------------------------------------------------------------

export type ScanType = "passive" | "active" | "full";

export interface InvestigateRequest {
  url: string;
  passive_only?: boolean;
  scan_type?: ScanType;
  skip_whois?: boolean;
  skip_screenshot?: boolean;
  skip_virustotal?: boolean;
  push_to_core?: boolean;
  trigger_dossier?: boolean;
  dataset?: string;
}

export interface InvestigateResponse {
  investigation_id: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  investigation_id: string;
  status: string;
  result?: InvestigationResult | null;
}

// ---------------------------------------------------------------------------
// Investigation result (passive recon + analysis)
// ---------------------------------------------------------------------------

export interface WHOISRecord {
  domain?: string;
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  registrant_country?: string;
  registrant_name?: string;
  registrant_org?: string;
  name_servers?: string[];
  status?: string[];
}

export interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface DNSRecords {
  a?: string[];
  aaaa?: string[];
  mx?: DNSRecord[];
  txt?: string[];
  ns?: string[];
  cname?: string[];
}

export interface SSLInfo {
  issuer?: string;
  subject?: string;
  serial_number?: string;
  not_before?: string;
  not_after?: string;
  sans?: string[];
  fingerprint_sha256?: string;
  self_signed?: boolean;
}

export interface GeoIPInfo {
  ip?: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  asn?: string;
}

export interface ThreatIndicator {
  indicator_type: string;
  value: string;
  context?: string;
  source?: string;
}

export interface ScamClassification {
  scam_type?: string;
  confidence?: number;
  summary?: string;
}

export interface FraudTaxonomyResult {
  risk_score: number;
  explanation?: string;
  intent?: Array<{ label: string; confidence: number }>;
  channel?: Array<{ label: string; confidence: number }>;
  techniques?: Array<{ label: string; confidence: number }>;
  actions?: Array<{ label: string; confidence: number }>;
  persona?: Array<{ label: string; confidence: number }>;
}

export interface InvestigationResult {
  url?: string;
  status?: string;
  success?: boolean;
  error?: string;
  duration_seconds?: number;
  passive_only?: boolean;

  // Passive recon
  whois?: WHOISRecord;
  dns?: DNSRecords;
  ssl?: SSLInfo;
  geoip?: GeoIPInfo;

  // Analysis
  classification?: ScamClassification;
  taxonomy_result?: FraudTaxonomyResult;
  brand_impersonation?: string;
  threat_indicators?: ThreatIndicator[];

  // Evidence
  pdf_report_path?: string;
  evidence_zip_path?: string;

  // Meta
  warnings?: string[];
  agent_steps?: number;
  cost_summary?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Scan (stored investigation from ScanStore)
// ---------------------------------------------------------------------------

export type ScanStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "partial";

export interface ScanSummary {
  scan_id: string;
  url: string;
  domain?: string;
  scan_type?: string;
  status: ScanStatus;
  risk_score?: number | null;
  classification_result?: ScamClassification | null;
  passive_result?: Record<string, unknown> | null;
  active_result?: Record<string, unknown> | null;
  evidence_path?: string | null;
  case_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  wallet_count?: number;
}

export interface InvestigationsListResponse {
  items: ScanSummary[];
  count: number;
  limit: number;
  offset: number;
}

export interface InvestigationDetailResponse {
  scan: ScanSummary;
  wallets: WalletRecord[];
  pii_exposures: PIIExposure[];
  agent_actions: AgentAction[];
}

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export interface WalletRecord {
  wallet_id: string;
  scan_id: string;
  token_symbol: string;
  token_label?: string;
  network_short: string;
  network_label?: string;
  wallet_address: string;
  source?: string;
  confidence?: number;
  site_url?: string;
  case_id?: string | null;
  created_at: string;
}

export interface WalletsSearchResponse {
  items: WalletRecord[];
  count: number;
}

// ---------------------------------------------------------------------------
// PII Exposures
// ---------------------------------------------------------------------------

export interface PIIExposure {
  exposure_id: string;
  scan_id: string;
  field_type: string;
  field_label?: string;
  form_action?: string;
  is_required?: boolean;
  was_submitted?: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Agent Actions (audit trail)
// ---------------------------------------------------------------------------

export interface AgentAction {
  action_id: string;
  scan_id: string;
  state: string;
  sequence: number;
  action_type?: string;
  action_detail?: Record<string, unknown>;
  screenshot_path?: string;
  page_url?: string;
  dom_confidence?: number;
  llm_model?: string;
  llm_input_tokens?: number;
  llm_output_tokens?: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// WebSocket Events
// ---------------------------------------------------------------------------

export type SSIEventType =
  | "site_started"
  | "site_completed"
  | "state_changed"
  | "screenshot_update"
  | "action_executed"
  | "wallet_found"
  | "playbook_matched"
  | "playbook_completed"
  | "guidance_needed"
  | "guidance_received"
  | "log"
  | "progress"
  | "error"
  | "snapshot"
  | "keepalive";

export interface SSIEvent {
  event_type: SSIEventType;
  timestamp: string;
  investigation_id: string;
  data: Record<string, unknown>;
}

export interface SSISnapshot {
  screenshot_b64?: string;
  state?: string;
  url?: string;
  uptime_sec?: number;
}

export type GuidanceAction = "click" | "type" | "goto" | "skip" | "continue";

export interface GuidanceCommand {
  action: GuidanceAction;
  value?: string;
  reason?: string;
}
