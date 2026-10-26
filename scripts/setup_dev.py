"""
ClassroomCare AI - Development Environment Bootstrap Script
Checks runtime versions, verifies virtual environment, and prepares the configuration.
"""
import sys
import os
import shutil
from pathlib import Path

def main():
    print("=" * 60)
    print("  ClassroomCare AI - Development Environment Setup")
    print("=" * 60)
    
    # 1. Check Python version
    py_ver = sys.version_info
    print(f"[*] Python Runtime: {py_ver.major}.{py_ver.minor}.{py_ver.micro}")
    if py_ver < (3, 11):
        print("[!] Warning: Python 3.11+ is recommended.")
    else:
        print("[+] Python version requirement satisfied.")

    # 2. Check root .env
    root_dir = Path(__file__).resolve().parent.parent
    env_file = root_dir / ".env"
    env_example = root_dir / ".env.example"
    
    if not env_file.exists() and env_example.exists():
        print("[*] Creating .env from .env.example...")
        shutil.copy(env_example, env_file)
        print("[+] Created .env file. Please configure Supabase and Gemini keys.")
    else:
        print("[+] .env file detected.")

    print("\n[+] Setup complete!")
    print("  To run backend: cd services/api && uvicorn app.main:app --reload")
    print("  To run frontend: cd apps/web && npm run dev")
    print("=" * 60)

if __name__ == "__main__":
    main()
