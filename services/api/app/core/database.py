import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any
from app.models.schemas import (
    Campus, Building, Room, Asset, MaintenanceRequest, MaintenanceRequestCreate,
    WorkOrder, WorkOrderStatus, RequestEvent, RequestCategory, RequestPriority,
    RequestStatus, KnowledgeDocument, DocumentChunk, Citation, AgentRun,
    SLAPolicy, AuditLog, Notification, AnalyticsOverview
)
from app.core.safety_rules import evaluate_deterministic_safety, assert_safety_priority_lock
from app.core.config import settings

logger = logging.getLogger(__name__)

class CampusRepository:
    def __init__(self):
        self.campuses: Dict[str, Campus] = {}
        self.buildings: Dict[str, Building] = {}
        self.rooms: Dict[str, Room] = {}
        self.assets: Dict[str, Asset] = {}
        self.tickets: Dict[str, MaintenanceRequest] = {}
        self.knowledge_docs: Dict[str, KnowledgeDocument] = {}
        self.document_chunks: Dict[str, DocumentChunk] = {}
        self.agent_runs: Dict[str, AgentRun] = {}
        self.sla_policies: Dict[str, SLAPolicy] = {}
        self.audit_logs: List[AuditLog] = []
        self.notifications: List[Notification] = []
        self._seed_initial_fixtures()

    def _seed_initial_fixtures(self):
        """Seeds realistic educational facilities and equipment with explicit fixture markers."""
        campus_id = "campus-main-01"
        self.campuses[campus_id] = Campus(
            id=campus_id,
            name="Noorul Islam Centre for Higher Education",
            code="NIU-KUMARACOIL",
            address="Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu, India - 629 180",
            safety_desk_phone="(+91) 4651-250 566",
            ehs_email="info@niuniv.com"
        )

        # Buildings (Verified NIU Academic Infrastructure)
        bld_sci = Building(
            id="bld-aero-01",
            campus_id=campus_id,
            code="AERO",
            name="Aeronautical & Aerospace Engineering Block",
            floors=4,
            emergency_shutoff_coords="Ground Floor Utility Core A-1 (Main Breaker)"
        )
        bld_eng = Building(
            id="bld-cse-02",
            campus_id=campus_id,
            code="CSE",
            name="Computer Science & Engineering Tech Block",
            floors=5,
            emergency_shutoff_coords="Server Room Annex B-1 (Panel Sub-2)"
        )
        self.buildings[bld_sci.id] = bld_sci
        self.buildings[bld_eng.id] = bld_eng

        # Rooms
        r101 = Room(
            id="room-sci-101",
            campus_id=campus_id,
            building_id=bld_sci.id,
            room_number="101",
            floor=1,
            name="Organic Chemistry Lab A",
            capacity=32,
            room_type="Chemistry Lab",
            status="Available"
        )
        r204 = Room(
            id="room-sci-204",
            campus_id=campus_id,
            building_id=bld_sci.id,
            room_number="204",
            floor=2,
            name="Bio-Nanotech Lecture Theatre",
            capacity=120,
            room_type="Lecture Hall",
            status="Available"
        )
        r302 = Room(
            id="room-eng-302",
            campus_id=campus_id,
            building_id=bld_eng.id,
            room_number="302",
            floor=3,
            name="Advanced Robotics Mechatronics Lab",
            capacity=45,
            room_type="Computer Lab",
            status="Available"
        )
        self.rooms[r101.id] = r101
        self.rooms[r204.id] = r204
        self.rooms[r302.id] = r302

        # Assets
        a1 = Asset(
            id="asset-hvac-01",
            campus_id=campus_id,
            room_id=r204.id,
            name="Trane Voyager Rooftop Packaged Unit 10T",
            category="HVAC",
            model_number="TRN-VOY-120A",
            serial_number="SN-TRANE-88392-C",
            install_date="2022-08-15",
            warranty_expiry="2027-08-15",
            status="Operational",
            last_inspected_at="2026-08-10",
            next_pm_due="2026-11-10"
        )
        a2 = Asset(
            id="asset-proj-02",
            campus_id=campus_id,
            room_id=r204.id,
            name="Panasonic PT-MZ880 Laser Projector 8000lm",
            category="AV/IT",
            model_number="PAN-PT-MZ880",
            serial_number="SN-PAN-44120-P",
            install_date="2023-01-20",
            warranty_expiry="2026-01-20",
            status="Operational",
            last_inspected_at="2026-06-14",
            next_pm_due="2026-12-14"
        )
        a3 = Asset(
            id="asset-fume-03",
            campus_id=campus_id,
            room_id=r101.id,
            name="Labconco Protector Premier Fume Hood 6ft",
            category="Laboratory Equipment",
            model_number="LAB-PRO-72-EX",
            serial_number="SN-LABC-99014-F",
            install_date="2021-04-10",
            warranty_expiry="2026-04-10",
            status="Operational",
            last_inspected_at="2026-09-01",
            next_pm_due="2026-11-01"
        )
        self.assets[a1.id] = a1
        self.assets[a2.id] = a2
        self.assets[a3.id] = a3

        # SLA Policies
        self.sla_policies[f"{campus_id}_EMERGENCY"] = SLAPolicy(
            id="sla-emer-01", campus_id=campus_id, priority=RequestPriority.EMERGENCY,
            response_time_minutes=15, resolve_time_hours=2, business_hours_only=False,
            escalation_contact="Campus Switchboard (+91-4651-250 566) / 112 (Emergency)"
        )
        self.sla_policies[f"{campus_id}_CRITICAL"] = SLAPolicy(
            id="sla-crit-02", campus_id=campus_id, priority=RequestPriority.CRITICAL,
            response_time_minutes=30, resolve_time_hours=6, business_hours_only=False,
            escalation_contact="Facilities Lead Desk (via Switchboard: +91-4651-250 566)"
        )
        self.sla_policies[f"{campus_id}_HIGH"] = SLAPolicy(
            id="sla-high-03", campus_id=campus_id, priority=RequestPriority.HIGH,
            response_time_minutes=120, resolve_time_hours=24, business_hours_only=True,
            escalation_contact="Area Maintenance Supervisor (via Switchboard: +91-4651-250 566)"
        )
        self.sla_policies[f"{campus_id}_MEDIUM"] = SLAPolicy(
            id="sla-med-04", campus_id=campus_id, priority=RequestPriority.MEDIUM,
            response_time_minutes=480, resolve_time_hours=72, business_hours_only=True,
            escalation_contact="Facilities Dispatch Desk (info@niuniv.com)"
        )
        self.sla_policies[f"{campus_id}_LOW"] = SLAPolicy(
            id="sla-low-05", campus_id=campus_id, priority=RequestPriority.LOW,
            response_time_minutes=1440, resolve_time_hours=168, business_hours_only=True,
            escalation_contact="Facilities Dispatch Desk (info@niuniv.com)"
        )

        # Preload Knowledge Base Documents with Verified Sections
        doc1 = KnowledgeDocument(
            id="doc-trn-voyager-manual",
            campus_id=campus_id,
            title="Trane Voyager Rooftop Unit Operations & Diagnostics Manual",
            category="OEM Manual",
            file_type="pdf",
            file_size_bytes=4200000,
            version="v3.4",
            chunk_count=3,
            uploaded_by="Facilities Engineering Dept",
            created_at="2026-01-15T09:00:00Z",
            status="Ready"
        )
        self.knowledge_docs[doc1.id] = doc1
        self.document_chunks["chk-trn-01"] = DocumentChunk(
            id="chk-trn-01",
            document_id=doc1.id,
            document_title=doc1.title,
            chunk_index=1,
            content=(
                "Section 4.2 - Compressor Lockout & Refrigerant Pressure Faults:\n"
                "If the Trane Voyager digital controller displays Fault Code Diagnostic 04 (High Pressure Cutout), "
                "verify that the condenser coil is unobstructed and the condenser fan motor is receiving 460V 3-phase power. "
                "Do NOT bypass the high pressure switch. Manual reset required after verifying airflow. "
                "Permitted refrigerant: R-410A only. Maximum test pressure: 150 PSI."
            ),
            metadata={"asset_model": "TRN-VOY-120A", "category": "HVAC", "section": "4.2"}
        )
        self.document_chunks["chk-trn-02"] = DocumentChunk(
            id="chk-trn-02",
            document_id=doc1.id,
            document_title=doc1.title,
            chunk_index=2,
            content=(
                "Section 7.1 - Blower Motor V-Belt Tension & Alignment:\n"
                "Inspect drive belt tension every 90 days. Deflection must be 0.5 inches under 5 lbs force. "
                "Belt replacement part number: TRN-BLT-B54. Always lock out electrical power at the main roof disconnect "
                "prior to removing the blower access door."
            ),
            metadata={"asset_model": "TRN-VOY-120A", "category": "HVAC", "section": "7.1"}
        )

        doc2 = KnowledgeDocument(
            id="doc-pan-projector-manual",
            campus_id=campus_id,
            title="Panasonic PT-MZ880 Series Laser Projector Technical Service Guide",
            category="OEM Manual",
            file_type="pdf",
            file_size_bytes=2800000,
            version="v1.2",
            chunk_count=2,
            uploaded_by="Campus IT Media Services",
            created_at="2026-02-10T11:30:00Z",
            status="Ready"
        )
        self.knowledge_docs[doc2.id] = doc2
        self.document_chunks["chk-pan-01"] = DocumentChunk(
            id="chk-pan-01",
            document_id=doc2.id,
            document_title=doc2.title,
            chunk_index=1,
            content=(
                "Section 3.1 - Solid-State Laser Warning & Filter Cleaning:\n"
                "When the FILTER indicator blinks orange, clean the eco-filter unit. "
                "If the LIGHT indicator blinks red 3 times, thermal shutdown has engaged due to blocked air exhaust. "
                "Allow unit to cool for 60 minutes. Clean exhaust vents with soft brush. Replacement filter unit: ET-RFR500."
            ),
            metadata={"asset_model": "PAN-PT-MZ880", "category": "AV/IT", "section": "3.1"}
        )

        doc3 = KnowledgeDocument(
            id="doc-safety-code",
            campus_id=campus_id,
            title="Noorul Islam Centre for Higher Education Campus Electrical & Chemical Safety Standard Operating Procedures",
            category="Campus Safety SOP",
            file_type="md",
            file_size_bytes=150000,
            version="v5.0",
            chunk_count=2,
            uploaded_by="Environmental Health & Safety",
            created_at="2026-03-01T08:00:00Z",
            status="Ready"
        )
        self.knowledge_docs[doc3.id] = doc3
        self.document_chunks["chk-safe-01"] = DocumentChunk(
            id="chk-safe-01",
            document_id=doc3.id,
            document_title=doc3.title,
            chunk_index=1,
            content=(
                "Section 12.4 - Electrical Hazards and Water Ingress Protocol:\n"
                "In any circumstance where standing water or leaking pipes threaten electrical distribution panels, "
                "outlets, or energized machinery, the space must be immediately locked out. "
                "Only NFPA-70E certified personnel may de-energize the circuit breaker. "
                "Never enter flooded space until electrical isolation is confirmed by campus safety."
            ),
            metadata={"policy_code": "SAFE-WATR-01", "category": "Safety Policy", "section": "12.4"}
        )

        # Seed realistic baseline maintenance tickets
        now = datetime.now(timezone.utc)
        t1 = self.create_ticket(
            ticket_in=MaintenanceRequestCreate(
                campus_id=campus_id,
                building_id=bld_sci.id,
                room_id=r204.id,
                asset_id=a1.id,
                title="Lecture Theatre 204 HVAC Blowing Lukewarm Air During Classes",
                description="Students and professor reported the room was 79F. Trane roof unit is running but air from diffusers is not cold.",
                category=RequestCategory.HVAC,
                priority=RequestPriority.HIGH
            ),
            requester_id="usr-faculty-101",
            requester_name="Prof. Eleanor Hayes (Bio Dept)"
        )
        # Assign technician to ticket 1
        self.assign_ticket(
            ticket_id=t1.id,
            technician_id="tech-hvac-001",
            technician_name="Samir Patel (HVAC Certified Tech)",
            actor_id="usr-facmgr-001",
            actor_name="Abishek"
        )

        # Seed Safety Incident (EMERGENCY)
        self.create_ticket(
            ticket_in=MaintenanceRequestCreate(
                campus_id=campus_id,
                building_id=bld_sci.id,
                room_id=r101.id,
                asset_id=a3.id,
                title="Chemical Fume Hood Alarm Sparking from Outlet in Room 101",
                description="Active sparking noticed at electrical switch on Wall B near the chemical fume hood. Faint burning ozone odor.",
                category=RequestCategory.ELECTRICAL,
                priority=RequestPriority.EMERGENCY
            ),
            requester_id="usr-labtech-202",
            requester_name="Rachel Greene (Chemistry Lab Manager)"
        )

    # --- Core Repository Methods & Supabase Persistence ---
    def _get_supabase_headers(self) -> Optional[Dict[str, str]]:
        if not settings.SUPABASE_URL or not settings.SUPABASE_URL.startswith("https://"):
            return None
        # Server-side persistence: favor valid service-role key (bypasses RLS for backend tasks), fallback to anon key
        has_service_key = bool(
            settings.SUPABASE_SERVICE_ROLE_KEY
            and len(settings.SUPABASE_SERVICE_ROLE_KEY) > 20
            and not settings.SUPABASE_SERVICE_ROLE_KEY.startswith("your-")
        )
        key = settings.SUPABASE_SERVICE_ROLE_KEY if has_service_key else settings.SUPABASE_ANON_KEY
        if not key or len(key) < 20:
            return None
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def get_campuses(self) -> List[Campus]:
        return list(self.campuses.values())

    def get_buildings(self, campus_id: str) -> List[Building]:
        clean_id = (campus_id or "").strip()
        target_ids = {clean_id} if clean_id else {"campus-main-01", "NIU-KUMARACOIL"}
        if clean_id in ("campus-main-01", "NIU-KUMARACOIL"):
            target_ids = {"campus-main-01", "NIU-KUMARACOIL"}

        headers = self._get_supabase_headers()
        if headers:
            try:
                import httpx
                with httpx.Client(timeout=4.0) as client:
                    resp = client.get(
                        f"{settings.SUPABASE_URL}/rest/v1/buildings?select=*",
                        headers=headers
                    )
                    if resp.status_code == 200:
                        rows = resp.json()
                        if rows:
                            db_buildings = [Building(**r) for r in rows]
                            for b in db_buildings:
                                self.buildings[b.id] = b
                            matches = [b for b in db_buildings if b.campus_id in target_ids]
                            if matches:
                                return matches
                            return db_buildings
            except Exception as e:
                logger.debug(f"Could not load buildings from Supabase: {e}")
        
        matches = [b for b in self.buildings.values() if b.campus_id in target_ids]
        if matches:
            return matches
        return list(self.buildings.values())

    def get_rooms(self, building_id: str) -> List[Room]:
        headers = self._get_supabase_headers()
        if headers:
            try:
                import httpx
                with httpx.Client(timeout=4.0) as client:
                    resp = client.get(
                        f"{settings.SUPABASE_URL}/rest/v1/rooms?building_id=eq.{building_id}&select=*",
                        headers=headers
                    )
                    if resp.status_code == 200:
                        rows = resp.json()
                        if rows:
                            db_rooms = [Room(**r) for r in rows]
                            for r in db_rooms:
                                self.rooms[r.id] = r
                            return db_rooms
            except Exception as e:
                logger.debug(f"Could not load rooms from Supabase: {e}")
        matches = [r for r in self.rooms.values() if r.building_id == building_id]
        if matches:
            return matches
        return [r for r in self.rooms.values() if r.building_id == building_id]

    def get_assets(self, room_id: Optional[str] = None) -> List[Asset]:
        if room_id:
            return [a for a in self.assets.values() if a.room_id == room_id]
        return list(self.assets.values())

    def add_building(self, building: Building) -> Building:
        self.buildings[building.id] = building
        headers = self._get_supabase_headers()
        if headers:
            try:
                import httpx
                payload = {
                    "id": building.id,
                    "campus_id": building.campus_id,
                    "code": building.code,
                    "name": building.name,
                    "floors": building.floors,
                    "emergency_shutoff_coords": building.emergency_shutoff_coords or "Not Specified",
                }
                with httpx.Client(timeout=4.0) as client:
                    client.post(
                        f"{settings.SUPABASE_URL}/rest/v1/buildings",
                        headers=headers,
                        json=payload
                    )
            except Exception as e:
                logger.debug(f"Could not persist building to Supabase: {e}")
        return building

    def add_room(self, room: Room) -> Room:
        self.rooms[room.id] = room
        headers = self._get_supabase_headers()
        if headers:
            try:
                import httpx
                payload = {
                    "id": room.id,
                    "campus_id": room.campus_id,
                    "building_id": room.building_id,
                    "room_number": room.room_number,
                    "floor": room.floor,
                    "name": room.name or f"Room {room.room_number}",
                    "capacity": room.capacity,
                    "room_type": room.room_type,
                    "status": room.status
                }
                with httpx.Client(timeout=4.0) as client:
                    client.post(
                        f"{settings.SUPABASE_URL}/rest/v1/rooms",
                        headers=headers,
                        json=payload
                    )
            except Exception as e:
                logger.debug(f"Could not persist room to Supabase: {e}")
        return room

    def create_ticket(
        self,
        ticket_in: MaintenanceRequestCreate,
        requester_id: str,
        requester_name: str
    ) -> MaintenanceRequest:
        now = datetime.now(timezone.utc)
        ticket_id = f"tkt-{uuid.uuid4().hex[:8]}"
        ticket_num = f"REQ-{now.strftime('%y%m')}-{len(self.tickets) + 101}"

        # Building & Room lookup
        bld = self.buildings.get(ticket_in.building_id)
        room = self.rooms.get(ticket_in.room_id)
        asset = self.assets.get(ticket_in.asset_id) if ticket_in.asset_id else None

        building_name = bld.name if bld else "Unknown Building"
        room_number = room.room_number if room else "General"
        asset_name = asset.name if asset else None

        # 1. Deterministic Safety Evaluation
        safety_triage = evaluate_deterministic_safety(ticket_in.title, ticket_in.description)
        is_safety = safety_triage.is_safety_critical
        hazard_code = safety_triage.hazard_code
        locked_priority = safety_triage.locked_priority

        # Calculate Priority
        if is_safety and locked_priority:
            priority = RequestPriority(locked_priority)
        elif ticket_in.priority:
            priority = ticket_in.priority
        else:
            priority = RequestPriority.MEDIUM

        category = ticket_in.category or RequestCategory.OTHER

        # SLA calculation
        sla_resp_minutes = safety_triage.sla_response_minutes or (30 if priority == RequestPriority.CRITICAL else 120)
        sla_resp_due = (now + timedelta(minutes=sla_resp_minutes)).isoformat()
        sla_resolve_due = (now + timedelta(hours=6 if priority in [RequestPriority.EMERGENCY, RequestPriority.CRITICAL] else 48)).isoformat()

        # Duplicate check across active tickets in same room
        duplicate_id = None
        for existing in self.tickets.values():
            if existing.status not in [RequestStatus.RESOLVED, RequestStatus.CLOSED, RequestStatus.REJECTED]:
                if existing.room_id == ticket_in.room_id and existing.category == category:
                    duplicate_id = existing.id
                    break

        ticket = MaintenanceRequest(
            id=ticket_id,
            ticket_number=ticket_num,
            campus_id=ticket_in.campus_id,
            building_id=ticket_in.building_id,
            building_name=building_name,
            room_id=ticket_in.room_id,
            room_number=room_number,
            asset_id=ticket_in.asset_id,
            asset_name=asset_name,
            requester_id=requester_id,
            requester_name=requester_name,
            category=category,
            priority=priority,
            status=RequestStatus.SUBMITTED,
            title=ticket_in.title,
            description=ticket_in.description,
            is_safety_hazard=is_safety,
            hazard_code=hazard_code,
            safety_priority_locked=is_safety,
            safety_actions=safety_triage.mandatory_actions,
            sla_response_due=sla_resp_due,
            sla_resolve_due=sla_resolve_due,
            sla_breached=False,
            duplicate_of_id=duplicate_id,
            work_order=WorkOrder(id=f"wo-{ticket_id}", ticket_id=ticket_id),
            events=[
                RequestEvent(
                    id=f"evt-{uuid.uuid4().hex[:6]}",
                    ticket_id=ticket_id,
                    actor_id=requester_id,
                    actor_name=requester_name,
                    event_type="SUBMITTED",
                    message="Maintenance request submitted via intake portal.",
                    created_at=now.isoformat()
                )
            ],
            created_at=now.isoformat(),
            updated_at=now.isoformat()
        )

        if is_safety:
            ticket.events.append(
                RequestEvent(
                    id=f"evt-{uuid.uuid4().hex[:6]}",
                    ticket_id=ticket_id,
                    actor_id="system-safety-shield",
                    actor_name="Deterministic Safety Shield",
                    event_type="SAFETY_LOCK",
                    message=f"CRITICAL SAFETY HAZARD DETECTED ({hazard_code}). Priority locked to {locked_priority}. Escalated to {safety_triage.escalation_role}.",
                    payload={"actions": safety_triage.mandatory_actions, "matched_keyword": safety_triage.matched_keyword},
                    created_at=now.isoformat()
                )
            )
            # Create safety notification
            self.notifications.append(
                Notification(
                    id=f"notif-{uuid.uuid4().hex[:6]}",
                    campus_id=ticket_in.campus_id,
                    user_id="safety-officer-broadcast",
                    title=f"SAFETY ESCALATION: {ticket.title}",
                    message=f"Room {room_number} flagged for {hazard_code}. Actions: {', '.join(safety_triage.mandatory_actions[:2])}",
                    category="SAFETY_EMERGENCY",
                    ticket_id=ticket_id,
                    read=False,
                    created_at=now.isoformat()
                )
            )

        self.tickets[ticket_id] = ticket
        self._record_audit(
            campus_id=ticket_in.campus_id,
            entity_type="TICKET",
            entity_id=ticket_id,
            action="CREATE",
            actor_id=requester_id,
            actor_name=requester_name,
            diff={"title": ticket.title, "priority": str(ticket.priority), "is_safety": is_safety}
        )
        return ticket

    def assign_ticket(
        self,
        ticket_id: str,
        technician_id: str,
        technician_name: str,
        actor_id: str,
        actor_name: str
    ) -> Optional[MaintenanceRequest]:
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        now = datetime.now(timezone.utc).isoformat()
        ticket.assigned_technician_id = technician_id
        ticket.assigned_technician_name = technician_name
        ticket.status = RequestStatus.ASSIGNED
        ticket.updated_at = now
        if ticket.work_order:
            ticket.work_order.assigned_technician_id = technician_id
            ticket.work_order.assigned_technician_name = technician_name
            ticket.work_order.status = WorkOrderStatus.PENDING

        ticket.events.append(
            RequestEvent(
                id=f"evt-{uuid.uuid4().hex[:6]}",
                ticket_id=ticket_id,
                actor_id=actor_id,
                actor_name=actor_name,
                event_type="ASSIGNED",
                message=f"Assigned to technician {technician_name}.",
                created_at=now
            )
        )
        self.notifications.append(
            Notification(
                id=f"notif-{uuid.uuid4().hex[:6]}",
                campus_id=ticket.campus_id,
                user_id=technician_id,
                title=f"Work Order Assigned: {ticket.ticket_number}",
                message=f"{ticket.title} in {ticket.building_name} Room {ticket.room_number}",
                category="TICKET_ASSIGNED",
                ticket_id=ticket_id,
                read=False,
                created_at=now
            )
        )
        self._record_audit(ticket.campus_id, "TICKET", ticket_id, "ASSIGN", actor_id, actor_name, {"technician": technician_name})
        return ticket

    def update_ticket_status(
        self,
        ticket_id: str,
        new_status: RequestStatus,
        actor_id: str,
        actor_name: str,
        notes: Optional[str] = None
    ) -> Optional[MaintenanceRequest]:
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        now = datetime.now(timezone.utc).isoformat()
        old_status = ticket.status
        ticket.status = new_status
        ticket.updated_at = now

        msg = f"Status transitioned from {old_status.value} to {new_status.value}."
        if notes:
            msg += f" Note: {notes}"

        ticket.events.append(
            RequestEvent(
                id=f"evt-{uuid.uuid4().hex[:6]}",
                ticket_id=ticket_id,
                actor_id=actor_id,
                actor_name=actor_name,
                event_type="STATUS_CHANGE",
                message=msg,
                created_at=now
            )
        )
        self._record_audit(ticket.campus_id, "TICKET", ticket_id, "UPDATE_STATUS", actor_id, actor_name, {"old": old_status.value, "new": new_status.value})
        return ticket

    def get_tickets(
        self,
        campus_id: str,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        building_id: Optional[str] = None,
        assigned_to: Optional[str] = None
    ) -> List[MaintenanceRequest]:
        res = [t for t in self.tickets.values() if t.campus_id == campus_id]
        if category:
            res = [t for t in res if t.category.value == category]
        if priority:
            res = [t for t in res if t.priority.value == priority]
        if status:
            res = [t for t in res if t.status.value == status]
        if building_id:
            res = [t for t in res if t.building_id == building_id]
        if assigned_to:
            res = [t for t in res if t.assigned_technician_id == assigned_to]
        return sorted(res, key=lambda x: x.created_at, reverse=True)

    def get_ticket(self, ticket_id: str) -> Optional[MaintenanceRequest]:
        return self.tickets.get(ticket_id)

    def _fetch_supabase_tickets(self, campus_id: str) -> Optional[List[MaintenanceRequest]]:
        headers = self._get_supabase_headers()
        if not headers:
            return None
        try:
            import httpx
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(
                    f"{settings.SUPABASE_URL}/rest/v1/maintenance_requests?campus_id=eq.{campus_id}&select=*",
                    headers=headers
                )
                if resp.status_code == 200:
                    rows = resp.json()
                    if not rows and settings.ENABLE_DEMO_DATA and settings.ENVIRONMENT != "production":
                        return None
                    bld_map = {b.id: b.name for b in self.get_buildings(campus_id)}
                    res = []
                    for r in rows:
                        try:
                            bld_name = bld_map.get(r.get("building_id"), "Campus Facility")
                            t = MaintenanceRequest(
                                id=r["id"],
                                ticket_number=r.get("ticket_number", r["id"]),
                                campus_id=r["campus_id"],
                                building_id=r.get("building_id", ""),
                                building_name=bld_name,
                                room_id=r.get("room_id", ""),
                                room_number=r.get("room_number", "General"),
                                asset_id=r.get("asset_id"),
                                requester_id=r.get("requester_id", ""),
                                requester_name=r.get("requester_name", "Campus User"),
                                assigned_technician_id=r.get("assigned_technician_id"),
                                assigned_technician_name=r.get("assigned_technician_name"),
                                category=RequestCategory(r["category"]) if r.get("category") in RequestCategory._value2member_map_ else RequestCategory.OTHER,
                                priority=RequestPriority(r["priority"]) if r.get("priority") in RequestPriority._value2member_map_ else RequestPriority.MEDIUM,
                                status=RequestStatus(r["status"]) if r.get("status") in RequestStatus._value2member_map_ else RequestStatus.SUBMITTED,
                                title=r.get("title", ""),
                                description=r.get("description", ""),
                                is_safety_hazard=bool(r.get("is_safety_hazard", False)),
                                hazard_code=r.get("hazard_code"),
                                safety_priority_locked=bool(r.get("safety_priority_locked", False)),
                                safety_actions=r.get("safety_actions") or [],
                                sla_response_due=r.get("sla_response_due", r.get("created_at")),
                                sla_resolve_due=r.get("sla_resolve_due", r.get("created_at")),
                                sla_breached=bool(r.get("sla_breached", False)),
                                duplicate_of_id=r.get("duplicate_of_id"),
                                created_at=r.get("created_at"),
                                updated_at=r.get("updated_at", r.get("created_at"))
                            )
                            res.append(t)
                        except Exception as e:
                            logger.debug(f"Row mapping skipped: {e}")
                    return res
        except Exception as e:
            logger.debug(f"Supabase tickets query skipped: {e}")
        return None

    # --- Analytics & Overview Calculations ---
    def get_analytics(self, campus_id: str) -> AnalyticsOverview:
        # Check persistent Supabase tickets in production
        db_tickets = self._fetch_supabase_tickets(campus_id)
        if db_tickets is not None and (not settings.ENABLE_DEMO_DATA or settings.ENVIRONMENT == "production"):
            tickets = db_tickets
        elif db_tickets is not None and len(db_tickets) > 0:
            tickets = db_tickets
        else:
            tickets = [t for t in self.tickets.values() if t.campus_id == campus_id]
        open_cnt = sum(1 for t in tickets if t.status in [RequestStatus.SUBMITTED, RequestStatus.TRIAGE, RequestStatus.ASSIGNED])
        prog_cnt = sum(1 for t in tickets if t.status in [RequestStatus.IN_PROGRESS, RequestStatus.AWAITING_PARTS, RequestStatus.AWAITING_INSPECTION])
        resolved_cnt = sum(1 for t in tickets if t.status in [RequestStatus.RESOLVED, RequestStatus.CLOSED])
        safety_cnt = sum(1 for t in tickets if t.is_safety_hazard)
        breached_cnt = sum(1 for t in tickets if t.sla_breached)

        by_cat: Dict[str, int] = {}
        for t in tickets:
            by_cat[t.category.value] = by_cat.get(t.category.value, 0) + 1

        by_bld: Dict[str, int] = {}
        for t in tickets:
            by_bld[t.building_name] = by_bld.get(t.building_name, 0) + 1

        # Calculate real SLA compliance rate
        if tickets:
            compliance = round(((len(tickets) - breached_cnt) / len(tickets)) * 100.0, 1)
        else:
            compliance = 100.0

        # Calculate real Mean Time to Resolution from resolved/closed requests
        resolved_tickets = [t for t in tickets if t.status in [RequestStatus.RESOLVED, RequestStatus.CLOSED]]
        if resolved_tickets:
            durations = []
            for t in resolved_tickets:
                try:
                    c_at = datetime.fromisoformat(t.created_at.replace("Z", "+00:00"))
                    u_at = datetime.fromisoformat(t.updated_at.replace("Z", "+00:00"))
                    dur = max(0.1, (u_at - c_at).total_seconds() / 3600.0)
                    durations.append(dur)
                except Exception:
                    durations.append(1.0)
            avg_res_hours = round(sum(durations) / len(durations), 1)
        else:
            avg_res_hours = 0.0

        # Calculate real technician utilization based on active dispatches
        active_dispatches = sum(1 for t in tickets if t.status in [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.AWAITING_PARTS])
        tech_utilization = round(min(100.0, (active_dispatches / 5.0) * 100.0), 1) if active_dispatches > 0 else 0.0

        # Build real daily trend across last 7 days from ticket creation dates
        now = datetime.now(timezone.utc)
        daily_map: Dict[str, Dict[str, Any]] = {}
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%a")
            day_key = day.strftime("%Y-%m-%d")
            daily_map[day_key] = {"date": day_str, "reported": 0, "resolved": 0}

        for t in tickets:
            try:
                c_key = t.created_at[:10]
                if c_key in daily_map:
                    daily_map[c_key]["reported"] += 1
                if t.status in [RequestStatus.RESOLVED, RequestStatus.CLOSED]:
                    u_key = t.updated_at[:10]
                    if u_key in daily_map:
                        daily_map[u_key]["resolved"] += 1
            except Exception:
                pass

        daily_trend = list(daily_map.values())

        return AnalyticsOverview(
            open_requests=open_cnt,
            in_progress=prog_cnt,
            resolved_today=resolved_cnt,
            critical_safety_incidents=safety_cnt,
            sla_breaches=breached_cnt,
            sla_compliance_rate=compliance,
            average_resolution_hours=avg_res_hours,
            technician_utilization_rate=tech_utilization,
            issues_by_category=by_cat,
            issues_by_building=by_bld,
            daily_trend=daily_trend
        )

    def _record_audit(
        self,
        campus_id: str,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_id: str,
        actor_name: str,
        diff: Dict[str, Any]
    ):
        log = AuditLog(
            id=f"aud-{uuid.uuid4().hex[:8]}",
            campus_id=campus_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            actor_name=actor_name,
            diff=diff,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        self.audit_logs.append(log)

# Global singleton repository instance
repository = CampusRepository()
