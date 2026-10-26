from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.schemas import (
    MaintenanceRequest, MaintenanceRequestCreate, RequestStatus, WorkOrderStatus
)
from app.core.database import repository
from app.core.security import get_current_user, require_permission, AuthenticatedUser
from app.agent.graph import agent_graph

router = APIRouter(prefix="/tickets", tags=["Maintenance Requests"])

class AssignPayload(BaseModel):
    technician_id: str
    technician_name: str

class StatusPayload(BaseModel):
    status: RequestStatus
    notes: Optional[str] = None

class EvidencePayload(BaseModel):
    notes: str
    parts_used: List[Dict[str, Any]] = []
    evidence_urls: List[str] = []
    checklist_completed: bool = True

class VerifyPayload(BaseModel):
    approved: bool
    feedback: Optional[str] = None

@router.post("", response_model=MaintenanceRequest, status_code=status.HTTP_201_CREATED)
def create_maintenance_request(
    ticket_in: MaintenanceRequestCreate,
    user: AuthenticatedUser = Depends(require_permission("requests:create"))
):
    ticket = repository.create_ticket(
        ticket_in=ticket_in,
        requester_id=user.id,
        requester_name=user.full_name
    )
    # Run agent triage graph
    try:
        agent_graph.run(ticket)
    except Exception:
        pass
    return ticket

@router.get("", response_model=List[MaintenanceRequest])
def list_maintenance_requests(
    campus_id: str = Query("campus-main-01"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    building_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    return repository.get_tickets(
        campus_id=campus_id,
        category=category,
        priority=priority,
        status=status,
        building_id=building_id,
        assigned_to=assigned_to
    )

@router.get("/{ticket_id}", response_model=MaintenanceRequest)
def get_maintenance_request(
    ticket_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    ticket = repository.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found.")
    return ticket

@router.post("/{ticket_id}/assign", response_model=MaintenanceRequest)
def assign_technician(
    ticket_id: str,
    payload: AssignPayload,
    user: AuthenticatedUser = Depends(require_permission("requests:assign"))
):
    ticket = repository.assign_ticket(
        ticket_id=ticket_id,
        technician_id=payload.technician_id,
        technician_name=payload.technician_name,
        actor_id=user.id,
        actor_name=user.full_name
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return ticket

@router.patch("/{ticket_id}/status", response_model=MaintenanceRequest)
def update_status(
    ticket_id: str,
    payload: StatusPayload,
    user: AuthenticatedUser = Depends(get_current_user)
):
    ticket = repository.update_ticket_status(
        ticket_id=ticket_id,
        new_status=payload.status,
        actor_id=user.id,
        actor_name=user.full_name,
        notes=payload.notes
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return ticket

@router.post("/{ticket_id}/evidence", response_model=MaintenanceRequest)
def record_technician_evidence(
    ticket_id: str,
    payload: EvidencePayload,
    user: AuthenticatedUser = Depends(require_permission("work_orders:record_evidence"))
):
    ticket = repository.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    if ticket.work_order:
        ticket.work_order.work_notes = payload.notes
        ticket.work_order.parts_used = payload.parts_used
        ticket.work_order.evidence_urls = payload.evidence_urls
        ticket.work_order.status = WorkOrderStatus.COMPLETED
    repository.update_ticket_status(
        ticket_id=ticket_id,
        new_status=RequestStatus.AWAITING_INSPECTION,
        actor_id=user.id,
        actor_name=user.full_name,
        notes="Technician completed work checklist and uploaded resolution evidence."
    )
    return ticket

@router.post("/{ticket_id}/verify", response_model=MaintenanceRequest)
def verify_resolution(
    ticket_id: str,
    payload: VerifyPayload,
    user: AuthenticatedUser = Depends(require_permission("requests:verify_resolution"))
):
    ticket = repository.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    if payload.approved:
        if ticket.work_order:
            ticket.work_order.verified_by_manager = True
            ticket.work_order.status = WorkOrderStatus.VERIFIED
        repository.update_ticket_status(
            ticket_id=ticket_id,
            new_status=RequestStatus.RESOLVED,
            actor_id=user.id,
            actor_name=user.full_name,
            notes=f"Resolution verified and accepted. Feedback: {payload.feedback or 'Approved without issues.'}"
        )
    else:
        # Reopen flow
        repository.update_ticket_status(
            ticket_id=ticket_id,
            new_status=RequestStatus.IN_PROGRESS,
            actor_id=user.id,
            actor_name=user.full_name,
            notes=f"Resolution rejected during inspection. Reopened for corrective action: {payload.feedback}"
        )
    return ticket
