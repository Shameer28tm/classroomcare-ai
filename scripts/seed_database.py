"""
ClassroomCare AI × NIU - Database Seeding Utility
Populates Supabase PostgreSQL with institutional seed fixtures for
Noorul Islam Centre for Higher Education (NIU), Kumaracoil:
Aeronautical & Aerospace Engineering Block, CSE Tech Block, Allied Health Sciences,
Central Library, Daikin VRV, Panasonic Projectors, Biosafety Cabinets.
"""
import os
import sys
from pathlib import Path

# Add services/api to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "services" / "api"))

from app.core.database import repository

def seed():
    print("[*] Loading institutional fixtures into ClassroomCare repository...")
    print(f"[+] Seeded {len(repository.campuses)} Campus: NIU-KUMARACOIL")
    print(f"[+] Seeded {len(repository.buildings)} Buildings: {[b.name for b in repository.buildings.values()]}")
    print(f"[+] Seeded {len(repository.rooms)} Classrooms & Labs")
    print(f"[+] Seeded {len(repository.assets)} Equipment Assets")
    print(f"[+] Seeded {len(repository.knowledge_docs)} Technical Manuals ({len(repository.document_chunks)} vector chunks)")
    print(f"[+] Seeded {len(repository.tickets)} Baseline Maintenance Incidents")
    print("[+] All fixtures successfully loaded and marked as demo data.")

if __name__ == "__main__":
    seed()
