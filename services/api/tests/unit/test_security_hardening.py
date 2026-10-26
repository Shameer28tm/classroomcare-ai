import pytest
from fastapi import HTTPException
from app.core.security import get_current_user, UserRole, AuthenticatedUser
from app.core.config import settings

def test_production_auth_required_when_demo_disabled(monkeypatch):
    """Verify that in production mode with demo disabled, omitting Authorization raises 401."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ENABLE_DEMO_DATA", False)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(authorization=None)
    assert exc_info.value.status_code == 401
    assert "Production authentication required" in exc_info.value.detail

def test_production_role_escalation_blocked(monkeypatch):
    """Verify that in production mode, client header X-User-Role cannot escalate role."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ENABLE_DEMO_DATA", False)

    # Valid token header format
    user = get_current_user(
        authorization="Bearer valid-token-12345",
        x_user_role="campus_admin"  # Client trying to self-escalate
    )
    # Role must NOT be campus_admin; it defaults to student_faculty
    assert user.role == UserRole.STUDENT_FACULTY
    assert "requests:triage" not in user.permissions

def test_development_mode_allows_demo_role(monkeypatch):
    """Verify that development/test mode preserves demo role switching for interactive tests."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "ENABLE_DEMO_DATA", True)

    user = get_current_user(
        authorization=None,
        x_user_role="technician"
    )
    assert user.role == "technician"
    assert "work_orders:read" in user.permissions
