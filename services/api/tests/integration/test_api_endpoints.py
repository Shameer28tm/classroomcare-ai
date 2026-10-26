"""
ClassroomCare AI × NIU
Comprehensive API Integration & Security Test Suite
Tests: Status Codes, Validation, Authentication, RBAC Authorization, and Diagnostics.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import RequestCategory, RequestPriority

client = TestClient(app)

# 1. System Health & Diagnostics
def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["campus_code"] == "NIU-KUMARACOIL"
    assert "Noorul Islam Centre for Higher Education" in data["institution"]

def test_readiness_check_endpoint():
    res = client.get("/readiness")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "supabase" in data
    assert "gemini" in data

def test_supabase_status_endpoint():
    res = client.get("/supabase-status")
    assert res.status_code == 200
    data = res.json()
    assert "phases" in data
    assert "phase_1_api_process" in data["phases"]
    assert data["phases"]["phase_1_api_process"]["status"] == "PASS"

def test_gemini_status_endpoint():
    res = client.get("/gemini-status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "is_configured" in data

# 2. Authentication & Token Verification (401)
def test_auth_invalid_token_header_rejected():
    res = client.get(
        "/api/v1/tickets",
        headers={"Authorization": "Bearer invalid"}
    )
    assert res.status_code == 401
    assert "expired, invalid, or revoked" in res.json()["detail"]

def test_auth_expired_token_rejected():
    res = client.get(
        "/api/v1/tickets",
        headers={"Authorization": "Bearer expired"}
    )
    assert res.status_code == 401

def test_auth_malformed_scheme_rejected():
    res = client.get(
        "/api/v1/tickets",
        headers={"Authorization": "Basic dXNlcjpwYXNz"}
    )
    assert res.status_code == 401
    assert "Expected 'Bearer <token>'" in res.json()["detail"]

# 3. RBAC Permission Boundaries (403 Forbidden)
def test_student_role_forbidden_from_assigning_technician():
    # Student attempts to assign a technician
    res = client.post(
        "/api/v1/tickets/any-ticket-id/assign",
        json={"technician_id": "tech-01", "technician_name": "Tech Dave"},
        headers={"X-User-Role": "student_faculty"}
    )
    assert res.status_code == 403
    assert "lacks required permission 'requests:assign'" in res.json()["detail"]

def test_technician_forbidden_from_uploading_knowledge_doc():
    res = client.post(
        "/api/v1/knowledge/upload",
        data={
            "title": "Unapproved Tech Notes",
            "category": "Notes",
            "version": "v1.0",
            "content": "Bypassing the condenser coil."
        },
        headers={"X-User-Role": "technician"}
    )
    assert res.status_code == 403
    assert "lacks required permission 'knowledge:upload'" in res.json()["detail"]

def test_student_forbidden_from_viewing_audit_logs():
    res = client.get(
        "/api/v1/audit/logs",
        headers={"X-User-Role": "student_faculty"}
    )
    assert res.status_code == 403
    assert "lacks required permission 'audit:view_safety'" in res.json()["detail"]

# 4. Input Validation & Schema Enforcement (422 Unprocessable Entity)
def test_ticket_creation_missing_required_fields_returns_422():
    res = client.post(
        "/api/v1/tickets",
        json={"title": "Incomplete"} # Missing campus_id, building_id, category, description, priority
    )
    assert res.status_code == 422

def test_ticket_creation_invalid_priority_enum_returns_422():
    res = client.post(
        "/api/v1/tickets",
        json={
            "campus_id": "campus-main-01",
            "building_id": "bld-aero-01",
            "title": "Bad Priority",
            "description": "Testing invalid enum",
            "category": "Electrical",
            "priority": "SUPER_URGENT" # Invalid priority enum
        }
    )
    assert res.status_code == 422

def test_knowledge_upload_empty_content_returns_422():
    res = client.post(
        "/api/v1/knowledge/upload",
        data={
            "title": "Empty Document",
            "category": "General",
            "version": "v1.0",
            "content": "   " # Whitespace only
        },
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 422
    assert "cannot be empty" in res.json()["detail"]

# 5. Missing Records (404 Not Found)
def test_nonexistent_ticket_returns_404():
    res = client.get("/api/v1/tickets/non-existent-uuid-99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]

def test_nonexistent_ticket_status_update_returns_404():
    res = client.patch(
        "/api/v1/tickets/non-existent-uuid-99999/status",
        json={"status": "In Progress", "notes": "Starting work"}
    )
    assert res.status_code == 404

# 6. Facilities & Verified Inventory Operations
def test_list_campuses_and_buildings():
    res_campuses = client.get("/api/v1/facilities/campuses")
    assert res_campuses.status_code == 200
    campuses = res_campuses.json()
    assert len(campuses) >= 1
    assert campuses[0]["code"] == "NIU-KUMARACOIL"

    res_buildings = client.get("/api/v1/facilities/buildings?campus_id=campus-main-01")
    assert res_buildings.status_code == 200
    buildings = res_buildings.json()
    assert any("Aeronautical" in b["name"] or "Computer" in b["name"] for b in buildings)

def test_authorized_asset_creation_succeeds():
    payload = {
        "id": "asset-test-scope-01",
        "campus_id": "campus-main-01",
        "room_id": "room-aero-101",
        "name": "Tektronix 4-Channel Digital Oscilloscope 100MHz",
        "category": "Laboratory Equipment",
        "model_number": "TBS1104B",
        "serial_number": "SN-TEK-99014-NIU",
        "install_date": "2024-01-10",
        "warranty_expiry": "2027-01-10",
        "status": "Operational",
        "last_inspected_at": "2026-06-01",
        "next_pm_due": "2026-12-01"
    }
    res = client.post(
        "/api/v1/facilities/assets",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 201
    assert res.json()["id"] == "asset-test-scope-01"

def test_authorized_building_creation_and_listing():
    payload = {
        "id": "bld-mech-test-01",
        "campus_id": "campus-main-01",
        "name": "Mechanical & Thermal Science Complex",
        "code": "MECH-01",
        "total_floors": 4,
        "emergency_shutoff_location": "Ground Floor South Entrance Utility Cabinet"
    }
    res = client.post(
        "/api/v1/facilities/buildings",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["id"] == "bld-mech-test-01"
    assert data["name"] == payload["name"]

    # Verify building is retrievable via GET
    get_res = client.get("/api/v1/facilities/buildings?campus_id=campus-main-01")
    assert get_res.status_code == 200
    bld_ids = [b["id"] for b in get_res.json()]
    assert "bld-mech-test-01" in bld_ids

def test_unauthorized_building_creation_blocked():
    payload = {
        "id": "bld-unauth-01",
        "campus_id": "campus-main-01",
        "name": "Unauthorized Building Entry",
        "code": "UNAUTH-01",
        "total_floors": 1
    }
    res = client.post(
        "/api/v1/facilities/buildings",
        json=payload,
        headers={"X-User-Role": "student_faculty"}
    )
    assert res.status_code == 403
    assert "lacks required permission 'facilities:manage'" in res.json()["detail"]

def test_authorized_room_creation_succeeds():
    payload = {
        "id": "room-mech-101",
        "campus_id": "campus-main-01",
        "building_id": "bld-mech-test-01",
        "room_number": "101",
        "floor": 1,
        "name": "Thermodynamics Instrumentation Lab",
        "room_type": "Laboratory",
        "capacity": 45
    }
    res = client.post(
        "/api/v1/facilities/rooms",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 201
    assert res.json()["room_number"] == "101"

def test_analytics_metrics_calculation_consistency():
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "open_requests" in data
    assert "in_progress" in data
    assert "resolved_today" in data
    assert "critical_safety_incidents" in data
    assert "average_resolution_hours" in data
    assert "sla_compliance_rate" in data
    assert "technician_utilization_rate" in data
    assert "daily_trend" in data
    assert len(data["daily_trend"]) == 7
    for day in data["daily_trend"]:
        assert "date" in day
        assert "reported" in day
        assert "resolved" in day
        assert isinstance(day["reported"], int)
        assert isinstance(day["resolved"], int)
    assert data["sla_compliance_rate"] >= 0.0 and data["sla_compliance_rate"] <= 100.0
    assert data["average_resolution_hours"] >= 0.0

def test_duplicate_building_code_returns_409():
    # Attempt to create building with already existing code 'MECH-01'
    payload = {
        "id": "bld-mech-dup-01",
        "campus_id": "campus-main-01",
        "name": "Duplicate Mechanical Block",
        "code": "MECH-01",
        "floors": 2
    }
    res = client.post(
        "/api/v1/facilities/buildings",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 409
    assert "already exists in campus" in res.json()["detail"]

def test_building_creation_cross_campus_isolation():
    # Manager of campus-main-01 attempts to create building for another campus
    payload = {
        "id": "bld-foreign-01",
        "campus_id": "campus-remote-99",
        "name": "Unauthorized Remote Building",
        "code": "REMOTE-01",
        "floors": 2
    }
    res = client.post(
        "/api/v1/facilities/buildings",
        json=payload,
        headers={"X-User-Role": "facilities_manager", "X-Campus-Id": "campus-main-01"}
    )
    assert res.status_code == 403
    assert "Campus Data Isolation Error" in res.json()["detail"]

def test_room_creation_nonexistent_parent_building_returns_404():
    payload = {
        "id": "room-orphan-01",
        "campus_id": "campus-main-01",
        "building_id": "bld-does-not-exist-000",
        "room_number": "999",
        "floor": 9,
        "name": "Orphan Room"
    }
    res = client.post(
        "/api/v1/facilities/rooms",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 404
    assert "not found in campus" in res.json()["detail"]

def test_duplicate_room_number_in_same_building_returns_409():
    # Room 101 was created in bld-mech-test-01 in test_authorized_room_creation_succeeds
    payload = {
        "id": "room-mech-101-dup",
        "campus_id": "campus-main-01",
        "building_id": "bld-mech-test-01",
        "room_number": "101",
        "floor": 1,
        "name": "Duplicate Room 101"
    }
    res = client.post(
        "/api/v1/facilities/rooms",
        json=payload,
        headers={"X-User-Role": "facilities_manager"}
    )
    assert res.status_code == 409
    assert "already exists in building" in res.json()["detail"]


