import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_readiness_endpoint():
    response = client.get("/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"

def test_list_facilities_and_assets():
    res = client.get("/api/v1/facilities/campuses")
    assert res.status_code == 200
    campuses = res.json()
    assert len(campuses) > 0
    campus_id = campuses[0]["id"]

    bld_res = client.get(f"/api/v1/facilities/buildings?campus_id={campus_id}")
    assert bld_res.status_code == 200
    buildings = bld_res.json()
    assert len(buildings) > 0

def test_create_and_lifecycle_ticket():
    # 1. Create standard ticket
    payload = {
        "campus_id": "campus-main-01",
        "building_id": "bld-eng-02",
        "room_id": "room-eng-302",
        "title": "Robotics lab smart screen HDMI flickers",
        "description": "The wall display loses sync whenever the projector resolution changes.",
        "category": "Networking",
        "priority": "MEDIUM"
    }
    create_res = client.post("/api/v1/tickets", json=payload)
    assert create_res.status_code == 201
    ticket = create_res.json()
    ticket_id = ticket["id"]
    assert ticket["title"] == payload["title"]
    assert ticket["status"] == "Submitted"

    # 2. Assign technician
    assign_res = client.post(
        f"/api/v1/tickets/{ticket_id}/assign",
        json={"technician_id": "tech-gen-003", "technician_name": "Carlos Mendez"}
    )
    assert assign_res.status_code == 200
    assigned_ticket = assign_res.json()
    assert assigned_ticket["status"] == "Assigned"
    assert assigned_ticket["assigned_technician_name"] == "Carlos Mendez"

    # 3. Technician records work evidence
    evidence_res = client.post(
        f"/api/v1/tickets/{ticket_id}/evidence",
        json={
            "notes": "Replaced damaged HDMI 2.1 cable with shielded Belkin 4K cable.",
            "parts_used": [{"part_number": "CAB-HDMI-4K", "qty": 1}],
            "evidence_urls": ["https://storage.campus.edu/evidence/hdmi_fix.jpg"],
            "checklist_completed": True
        }
    )
    assert evidence_res.status_code == 200
    in_insp_ticket = evidence_res.json()
    assert in_insp_ticket["status"] == "Awaiting Inspection"

    # 4. Verify resolution
    verify_res = client.post(
        f"/api/v1/tickets/{ticket_id}/verify",
        json={"approved": True, "feedback": "Display tested at 4K60Hz. Flawless sync."}
    )
    assert verify_res.status_code == 200
    resolved_ticket = verify_res.json()
    assert resolved_ticket["status"] == "Resolved"

def test_safety_hazard_triggers_lock_and_escalation():
    payload = {
        "campus_id": "campus-main-01",
        "building_id": "bld-sci-01",
        "room_id": "room-sci-101",
        "title": "Severe water gushing and standing water near electrical outlet",
        "description": "Water gushing from ceiling pipe directly over the power strip.",
        "category": "Plumbing"
    }
    res = client.post("/api/v1/tickets", json=payload)
    assert res.status_code == 201
    tkt = res.json()
    assert tkt["is_safety_hazard"] is True
    assert tkt["hazard_code"] == "SAFE-WATR-01"
    assert tkt["priority"] == "CRITICAL"
    assert tkt["safety_priority_locked"] is True
    assert len(tkt["safety_actions"]) > 0
