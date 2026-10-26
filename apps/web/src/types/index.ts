export type UserRole =
  | 'student_faculty'
  | 'technician'
  | 'facilities_manager'
  | 'safety_officer'
  | 'campus_admin';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export type RequestStatus =
  | 'Submitted'
  | 'Triage'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Parts'
  | 'Awaiting Inspection'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type RequestCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'HVAC'
  | 'Furniture'
  | 'Structural'
  | 'Networking'
  | 'Cleaning'
  | 'Laboratory Equipment'
  | 'Fire Safety'
  | 'Other';

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string;
  safety_desk_phone: string;
  ehs_email: string;
}

export interface Building {
  id: string;
  campus_id: string;
  code: string;
  name: string;
  floors: number;
  emergency_shutoff_coords: string;
}

export interface Room {
  id: string;
  campus_id: string;
  building_id: string;
  room_number: string;
  floor: number;
  name: string;
  capacity: number;
  room_type: string;
  status: string;
}

export interface Asset {
  id: string;
  campus_id: string;
  room_id: string;
  name: string;
  category: string;
  model_number: string;
  serial_number: string;
  install_date: string;
  warranty_expiry: string;
  status: string;
  last_inspected_at?: string;
  next_pm_due?: string;
}

export interface RequestEvent {
  id: string;
  ticket_id: string;
  actor_id: string;
  actor_name: string;
  event_type: string;
  message: string;
  payload?: Record<string, any>;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  ticket_id: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  status: 'Pending' | 'In Progress' | 'Paused' | 'Completed' | 'Verified';
  safety_checklist: any[];
  work_instructions: string[];
  parts_used: any[];
  work_notes: string;
  evidence_urls: string[];
  started_at?: string;
  completed_at?: string;
  verified_by_requester: boolean;
  verified_by_manager: boolean;
}

export interface MaintenanceRequest {
  id: string;
  ticket_number: string;
  campus_id: string;
  building_id: string;
  building_name: string;
  room_id: string;
  room_number: string;
  asset_id?: string;
  asset_name?: string;
  requester_id: string;
  requester_name: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  title: string;
  description: string;
  is_safety_hazard: boolean;
  hazard_code?: string;
  safety_priority_locked: boolean;
  safety_actions: string[];
  sla_response_due: string;
  sla_resolve_due: string;
  sla_breached: boolean;
  duplicate_of_id?: string;
  work_order?: WorkOrder;
  events: RequestEvent[];
  created_at: string;
  updated_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  chunk_id: string;
  section?: string;
  text_snippet: string;
}

export interface KnowledgeDocument {
  id: string;
  campus_id: string;
  title: string;
  category: string;
  file_type: string;
  file_size_bytes: number;
  version: string;
  chunk_count: number;
  uploaded_by: string;
  created_at: string;
  status: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, any>;
  relevance_score?: number;
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  grounded: boolean;
  confidence_score: number;
  abstained: boolean;
  explanation?: string;
  citations: Citation[];
}

export interface AgentExecutionNode {
  node_name: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'BYPASSED' | 'ABSTAINED';
  details: string;
}

export interface AgentRun {
  id: string;
  ticket_id: string;
  campus_id: string;
  status?: string;
  started_at: string;
  completed_at: string;
  nodes_executed: AgentExecutionNode[];
  deterministic_safety_hit: boolean;
  replan_count: number;
  decision_summary: string;
  recommended_priority: string;
  recommended_category: string;
  recommended_technician?: string;
  citations: Citation[];
  executed_tools: string[];
}

export interface Notification {
  id: string;
  campus_id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  ticket_id?: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  campus_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  diff: Record<string, any>;
  created_at: string;
}

export interface AnalyticsOverview {
  open_requests: number;
  in_progress: number;
  resolved_today: number;
  critical_safety_incidents: number;
  sla_breaches: number;
  sla_compliance_rate: number;
  average_resolution_hours: number;
  technician_utilization_rate: number;
  issues_by_category: Record<string, number>;
  issues_by_building: Record<string, number>;
  daily_trend: { date: string; reported: number; resolved: number }[];
}
