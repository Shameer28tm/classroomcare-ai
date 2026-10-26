import pytest
from app.core.safety_rules import (
    evaluate_deterministic_safety, assert_safety_priority_lock
)

def test_electrical_hazard_trigger():
    res = evaluate_deterministic_safety(
        title="Sparks coming from projector outlet",
        description="I saw sparks and smelled smoke coming from the power outlet."
    )
    assert res.is_safety_critical is True
    assert res.hazard_code == "SAFE-ELEC-01"
    assert res.locked_priority == "EMERGENCY"
    assert res.sla_response_minutes == 15
    assert "Campus Master Electrician" in res.escalation_role
    assert len(res.mandatory_actions) > 0

def test_gas_leak_hazard_trigger():
    res = evaluate_deterministic_safety(
        title="Strange gas smell in Room 104",
        description="Students smell rotten eggs and chemical fumes near the back door."
    )
    assert res.is_safety_critical is True
    assert res.hazard_code == "SAFE-GAS-01"
    assert res.locked_priority == "EMERGENCY"
    assert res.sla_response_minutes == 5
    assert "EHS" in res.escalation_role

def test_water_near_electrical_hazard_trigger():
    res = evaluate_deterministic_safety(
        title="Burst pipe in science ceiling",
        description="Water gushing and standing water near electrical panel."
    )
    assert res.is_safety_critical is True
    assert res.hazard_code == "SAFE-WATR-01"
    assert res.locked_priority == "CRITICAL"
    assert res.sla_response_minutes == 30

def test_structural_glass_hazard_trigger():
    res = evaluate_deterministic_safety(
        title="Shattered window in study lounge",
        description="A tree branch broke the window pane and glass is scattered on the floor."
    )
    assert res.is_safety_critical is True
    assert res.hazard_code == "SAFE-STRU-01"
    assert res.locked_priority == "CRITICAL"

def test_standard_non_hazardous_issue():
    res = evaluate_deterministic_safety(
        title="Whiteboard marker tray is loose",
        description="The plastic tray under the whiteboard fell off."
    )
    assert res.is_safety_critical is False
    assert res.hazard_code is None
    assert res.locked_priority is None

def test_zero_override_safety_lockout():
    # If priority is locked to EMERGENCY, attempting to downgrade to LOW or MEDIUM must be rejected
    enforced = assert_safety_priority_lock(
        original_priority="EMERGENCY",
        proposed_priority="LOW",
        is_safety_locked=True
    )
    assert enforced == "EMERGENCY"

    # If priority is locked to CRITICAL, attempting to downgrade to HIGH must be rejected
    enforced_crit = assert_safety_priority_lock(
        original_priority="CRITICAL",
        proposed_priority="HIGH",
        is_safety_locked=True
    )
    assert enforced_crit == "CRITICAL"

    # If not safety locked, downgrade is permitted
    unlocked = assert_safety_priority_lock(
        original_priority="HIGH",
        proposed_priority="LOW",
        is_safety_locked=False
    )
    assert unlocked == "LOW"
