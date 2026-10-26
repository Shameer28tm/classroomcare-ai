from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator
import uuid
from datetime import datetime
from enum import Enum

class RequestCategory(str, Enum):
    ELECTRICAL = "Electrical"
    PLUMBING = "Plumbing"
    HVAC = "HVAC"
    FURNITURE = "Furniture"
    STRUCTURAL = "Structural"
    NETWORKING = "Networking"
    CLEANING = "Cleaning"
    LAB_EQUIPMENT = "Laboratory Equipment"
    FIRE_SAFETY = "Fire Safety"
    OTHER = "Other"

class RequestPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    EMERGENCY = "EMERGENCY"

class RequestStatus(str, Enum):
    SUBMITTED = "Submitted"
    TRIAGE = "Triage"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    AWAITING_PARTS = "Awaiting Parts"
    AWAITING_INSPECTION = "Awaiting Inspection"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REJECTED = "Rejected"

class WorkOrderStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    VERIFIED = "Verified"

# --- Facilities Schemas ---
class Asset(BaseModel):
    id: str
    campus_id: str
    room_id: str
    name: str
    category: str
    model_number: str
    serial_number: str
    install_date: str
    warranty_expiry: str
    status: str = "Operational" # "Operational" | "Maintenance Required" | "Decommissioned"
    last_inspected_at: Optional[str] = None
    next_pm_due: Optional[str] = None

class Room(BaseModel):
    id: str = Field(default="")
    campus_id: str
    building_id: str
    room_number: str
    floor: int = 1
    name: str = ""
    capacity: int = 40
    room_type: str = "Classroom" # "Lecture Hall" | "Chemistry Lab" | "Computer Lab" | "Seminar Room"
    status: str = "Available" # "Available" | "Maintenance Lockout" | "Occupied"
    assets: List[Asset] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def handle_room_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("id"):
                data["id"] = f"room-{uuid.uuid4().hex[:8]}"
            if not data.get("name") and data.get("room_number"):
                data["name"] = f"Room {data['room_number']}"
        return data

class Building(BaseModel):
    id: str = Field(default="")
    campus_id: str
    code: str
    name: str
    floors: int = 1
    emergency_shutoff_coords: str = ""
    rooms: List[Room] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def handle_building_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "total_floors" in data and "floors" not in data:
                data["floors"] = data["total_floors"]
            if "emergency_shutoff_location" in data and "emergency_shutoff_coords" not in data:
                data["emergency_shutoff_coords"] = data["emergency_shutoff_location"]
            if not data.get("id"):
                data["id"] = f"bld-{uuid.uuid4().hex[:8]}"
        return data

class Campus(BaseModel):
    id: str
    name: str
    code: str
    address: str
    safety_desk_phone: str
    ehs_email: str

# --- Ticket & Work Order Schemas ---
class RequestEvent(BaseModel):
    id: str
    ticket_id: str
    actor_id: str
    actor_name: str
    event_type: str # "SUBMITTED" | "SAFETY_LOCK" | "ASSIGNED" | "WORK_STARTED" | "EVIDENCE_UPLOADED" | "RESOLVED"
    message: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

class WorkOrder(BaseModel):
    id: str
    ticket_id: str
    assigned_technician_id: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    status: WorkOrderStatus = WorkOrderStatus.PENDING
    safety_checklist: List[Dict[str, Any]] = Field(default_factory=list)
    work_instructions: List[str] = Field(default_factory=list)
    parts_used: List[Dict[str, Any]] = Field(default_factory=list)
    work_notes: str = ""
    evidence_urls: List[str] = Field(default_factory=list)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    verified_by_requester: bool = False
    verified_by_manager: bool = False

class MaintenanceRequestCreate(BaseModel):
    campus_id: str
    building_id: str
    room_id: str
    asset_id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[RequestCategory] = None
    priority: Optional[RequestPriority] = None
    photo_urls: List[str] = Field(default_factory=list)

class MaintenanceRequest(BaseModel):
    id: str
    ticket_number: str
    campus_id: str
    building_id: str
    building_name: str
    room_id: str
    room_number: str
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    requester_id: str
    requester_name: str
    assigned_technician_id: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    category: RequestCategory
    priority: RequestPriority
    status: RequestStatus
    title: str
    description: str
    is_safety_hazard: bool = False
    hazard_code: Optional[str] = None
    safety_priority_locked: bool = False
    safety_actions: List[str] = Field(default_factory=list)
    sla_response_due: str
    sla_resolve_due: str
    sla_breached: bool = False
    duplicate_of_id: Optional[str] = None
    work_order: Optional[WorkOrder] = None
    events: List[RequestEvent] = Field(default_factory=list)
    created_at: str
    updated_at: str

# --- Knowledge & RAG Schemas ---
class KnowledgeDocument(BaseModel):
    id: str
    campus_id: str
    title: str
    category: str # "OEM Manual" | "Campus Safety SOP" | "Resolution Playbook" | "Electrical Code"
    file_type: str # "pdf" | "md" | "txt"
    file_size_bytes: int
    version: str
    chunk_count: int
    uploaded_by: str
    created_at: str
    status: str = "Ready" # "Ready" | "Indexing" | "Failed"

class DocumentChunk(BaseModel):
    id: str
    document_id: str
    document_title: str
    chunk_index: int
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    relevance_score: Optional[float] = None

class Citation(BaseModel):
    document_id: str
    document_title: str
    chunk_id: str
    section: Optional[str] = None
    text_snippet: str

class RAGQueryRequest(BaseModel):
    campus_id: str
    query: str
    category_filter: Optional[str] = None
    asset_model_filter: Optional[str] = None

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    grounded: bool
    confidence_score: float
    abstained: bool
    explanation: Optional[str] = None
    citations: List[Citation] = Field(default_factory=list)

# --- AI Agent Schemas ---
class AgentExecutionNode(BaseModel):
    node_name: str
    timestamp: str
    status: str # "SUCCESS" | "WARNING" | "BYPASSED" | "ABSTAINED"
    details: str

class AgentRun(BaseModel):
    id: str
    ticket_id: str
    campus_id: str
    status: str = "COMPLETED"
    started_at: str
    completed_at: str
    nodes_executed: List[AgentExecutionNode] = Field(default_factory=list)
    deterministic_safety_hit: bool = False
    replan_count: int = 0
    decision_summary: str
    recommended_priority: str
    recommended_category: str
    recommended_technician: Optional[str] = None
    citations: List[Citation] = Field(default_factory=list)
    executed_tools: List[str] = Field(default_factory=list)

# --- SLA & Escalation Schemas ---
class SLAPolicy(BaseModel):
    id: str
    campus_id: str
    priority: RequestPriority
    response_time_minutes: int
    resolve_time_hours: int
    business_hours_only: bool = False
    escalation_contact: str

# --- Audit & Notifications ---
class AuditLog(BaseModel):
    id: str
    campus_id: str
    entity_type: str # "TICKET" | "SAFETY" | "USER" | "POLICY" | "AGENT"
    entity_id: str
    action: str
    actor_id: str
    actor_name: str
    diff: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

class Notification(BaseModel):
    id: str
    campus_id: str
    user_id: str
    title: str
    message: str
    category: str # "SAFETY_EMERGENCY" | "SLA_BREACH" | "TICKET_ASSIGNED" | "RESOLUTION_VERIFY"
    ticket_id: Optional[str] = None
    read: bool = False
    created_at: str

class AnalyticsOverview(BaseModel):
    open_requests: int
    in_progress: int
    resolved_today: int
    critical_safety_incidents: int
    sla_breaches: int
    sla_compliance_rate: float
    average_resolution_hours: float
    technician_utilization_rate: float
    issues_by_category: Dict[str, int]
    issues_by_building: Dict[str, int]
    daily_trend: List[Dict[str, Any]]
