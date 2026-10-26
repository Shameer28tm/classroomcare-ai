from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.models.schemas import AgentRun
from app.core.database import repository
from app.core.security import get_current_user, AuthenticatedUser
from app.agent.graph import agent_graph

router = APIRouter(prefix="/agent", tags=["AI Maintenance Agent"])

@router.get("/runs", response_model=List[AgentRun])
def list_agent_runs(
    campus_id: str = Query("campus-main-01"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    runs = [r for r in repository.agent_runs.values() if r.campus_id == campus_id]
    return sorted(runs, key=lambda x: x.started_at, reverse=True)

@router.get("/runs/{run_id}", response_model=AgentRun)
def get_agent_run(
    run_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    run = repository.agent_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run trace not found.")
    return run

@router.post("/triage/{ticket_id}", response_model=AgentRun)
def trigger_agent_triage(
    ticket_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    ticket = repository.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    run = agent_graph.run(ticket)
    return run
