import re
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SafetyTriageResult(BaseModel):
    is_safety_critical: bool = False
    hazard_code: Optional[str] = None
    category: Optional[str] = None
    locked_priority: Optional[str] = None # "CRITICAL" | "EMERGENCY" | "HIGH"
    mandatory_actions: List[str] = Field(default_factory=list)
    escalation_role: Optional[str] = None
    sla_response_minutes: Optional[int] = None
    matched_keyword: Optional[str] = None
    safety_disclaimer: str = (
        "ClassroomCare AI deterministic safety notice: This automated triage is advisory and does not "
        "replace local 911 emergency services, building evacuation alarms, or qualified on-site inspection."
    )

SAFETY_RULE_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "code": "SAFE-ELEC-01",
        "category": "Electrical",
        "priority": "EMERGENCY",
        "sla_minutes": 15,
        "escalation_role": "Campus Master Electrician & Safety Officer",
        "patterns": [
            r"\bspark(ing|s)?\b",
            r"\bexposed wir(e|ing|es)\b",
            r"\belectric(al)? shock\b",
            r"\b(outlet|switch|breaker) smok(ing|e)\b",
            r"\bpanel burning\b",
            r"\bbreaker buzzing loudly\b",
            r"\blive wire(s)?\b"
        ],
        "actions": [
            "Lock room circuit breaker alert notification",
            "Dispatch on-call certified campus electrician",
            "Issue immediate safety broadcast to classroom coordinator",
            "Prohibit student and faculty entry until cleared"
        ]
    },
    {
        "code": "SAFE-GAS-01",
        "category": "Chemical/Gas",
        "priority": "EMERGENCY",
        "sla_minutes": 5,
        "escalation_role": "Environmental Health & Safety (EHS) Lead",
        "patterns": [
            r"\bgas smell\b",
            r"\bsmell of gas\b",
            r"\brotten egg(s)?\b",
            r"\bchemical spill\b",
            r"\bmercury spill\b",
            r"\bacid leak\b",
            r"\btoxic fumes?\b",
            r"\bcarbon monoxide\b",
            r"\bco alarm\b"
        ],
        "actions": [
            "Initiate immediate classroom evacuation checklist",
            "Dispatch EHS hazardous material incident team",
            "Notify local campus safety & municipal fire dispatch",
            "Shut off laboratory gas supply solenoid"
        ]
    },
    {
        "code": "SAFE-WATR-01",
        "category": "Plumbing/Water",
        "priority": "CRITICAL",
        "sla_minutes": 30,
        "escalation_role": "Facilities Operations Director & Plumbing Lead",
        "patterns": [
            r"\bburst pipe\b",
            r"\bwater gushing\b",
            r"\bceiling collapse\b",
            r"\bwater (near|over|into) (outlet|electrical|panel|projector|server)\b",
            r"\bstanding water near electric\b",
            r"\bactive ceiling flood\b"
        ],
        "actions": [
            "Locate and transmit main water riser shutoff coordinates",
            "Emergency dispatch for facilities plumbing team",
            "Disconnect electrical sub-panel serving flooded zone"
        ]
    },
    {
        "code": "SAFE-STRU-01",
        "category": "Structural/Glass",
        "priority": "CRITICAL",
        "sla_minutes": 45,
        "escalation_role": "Building Operations Structural Manager",
        "patterns": [
            r"\bshattered (glass|window|door)\b",
            r"\bbroken window pane\b",
            r"\bceiling tile (fell|falling|collapsed)\b",
            r"\bstructural crack\b",
            r"\bloose handrail\b",
            r"\bemergency exit (stuck|jammed|blocked)\b"
        ],
        "actions": [
            "Deploy caution barrier and cordon off affected perimeter",
            "Issue emergency work order to structural carpentry team",
            "Update room scheduling registry to mark space unavailable"
        ]
    },
    {
        "code": "SAFE-AIRQ-01",
        "category": "Air Quality/HVAC",
        "priority": "HIGH",
        "sla_minutes": 120,
        "escalation_role": "HVAC Operations Supervisor",
        "patterns": [
            r"\bblack mold visible\b",
            r"\bsewage odor\b",
            r"\bno heat (freezing|below 55)\b",
            r"\bextreme heat (above 88|stifling)\b",
            r"\bserver room overheating\b"
        ],
        "actions": [
            "Verify building automated BMS air handler telemetry",
            "Dispatch HVAC emergency diagnostic crew",
            "Stage auxiliary portable cooling or HEPA filtration units"
        ]
    }
]

def evaluate_deterministic_safety(title: str, description: str) -> SafetyTriageResult:
    """
    Evaluates maintenance request text against the deterministic safety matrix.
    Runs strictly in Python code with zero external AI or network dependencies.
    """
    combined_text = f"{title or ''} {description or ''}".lower()
    
    for rule in SAFETY_RULE_DEFINITIONS:
        for pattern in rule["patterns"]:
            match = re.search(pattern, combined_text, re.IGNORECASE)
            if match:
                return SafetyTriageResult(
                    is_safety_critical=True,
                    hazard_code=rule["code"],
                    category=rule["category"],
                    locked_priority=rule["priority"],
                    mandatory_actions=rule["actions"],
                    escalation_role=rule["escalation_role"],
                    sla_response_minutes=rule["sla_minutes"],
                    matched_keyword=match.group(0)
                )
                
    return SafetyTriageResult(is_safety_critical=False)


def assert_safety_priority_lock(
    original_priority: str,
    proposed_priority: str,
    is_safety_locked: bool
) -> str:
    """
    Enforces the Zero-Override Safety Principle:
    If a ticket has an active safety lock (CRITICAL or EMERGENCY),
    an LLM or non-admin user CANNOT downgrade its priority.
    """
    priority_weights = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4,
        "EMERGENCY": 5
    }
    
    if not is_safety_locked:
        return proposed_priority
        
    orig_weight = priority_weights.get(original_priority.upper(), 4)
    prop_weight = priority_weights.get(proposed_priority.upper(), 1)
    
    # If someone or an LLM tries to reduce severity below the locked priority, reject it
    if prop_weight < orig_weight:
        return original_priority
        
    return proposed_priority
