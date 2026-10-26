"""
Noorul Islam Centre for Higher Education (NIU)
Centralized Institutional Configuration & Public Provenance (Backend)

Source: Official University Website https://www.niuniv.com/
Retrieved: 2026-10-26
"""

from pydantic import BaseModel
from typing import List

class EmergencyDeskConfig(BaseModel):
    primary_phone: str = "(+91) 4651-250 566"
    emergency_services: str = "112 / 101 (Fire) / 108 (Ambulance)"
    description: str = "National and Local Emergency Protocols for Kumaracoil Campus"

class FacilitiesLeadConfig(BaseModel):
    display_name: str = "Abishek"
    role: str = "Facilities Manager"
    status: str = "unverified_demo"
    badge_notice: str = "Demo Record (Unverified — Awaiting Official Administrator Provisioning)"

class InstitutionalConfig(BaseModel):
    institution_name: str = "Noorul Islam Centre for Higher Education"
    institution_short_name: str = "NIU / NICHE"
    platform_name: str = "ClassroomCare AI — NIU Facilities & Campus Operations"
    tagline: str = "Autonomous Classroom Maintenance & Facilities Intelligence Platform"
    website_url: str = "https://www.niuniv.com/"
    campus_code: str = "NIU-KUMARACOIL"
    campus_name: str = "Main Campus — Kumaracoil"
    campus_address: str = "Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu, India - 629 180"
    switchboard_phone: str = "(+91) 4651-250 566"
    mobile_helpline: str = "+91 94868 56101"
    official_email: str = "info@niuniv.com"
    emergency_desk: EmergencyDeskConfig = EmergencyDeskConfig()
    facilities_lead: FacilitiesLeadConfig = FacilitiesLeadConfig()
    verified_departments: List[str] = [
        "Aeronautical Engineering",
        "Aerospace Engineering",
        "Aircraft Maintenance Engineering",
        "Automobile Engineering",
        "Biomedical Engineering",
        "Civil Engineering",
        "Computer Science and Engineering",
        "Electrical and Electronics Engineering",
        "Electronics and Communication Engineering",
        "Mechanical Engineering",
        "Marine Engineering",
        "Allied Health Sciences",
        "Management Studies",
        "Computer Applications",
        "Science & Humanities"
    ]

niu_institution_config = InstitutionalConfig()
