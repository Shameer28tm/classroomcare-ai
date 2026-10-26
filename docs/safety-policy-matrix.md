# ClassroomCare AI × NIU: Deterministic Safety Policy Matrix

## Institutional Purpose & Scope

This specification defines the deterministic physical life-safety and environmental hazard classifications for **ClassroomCare AI — NIU Facilities & Campus Operations** at **Noorul Islam Centre for Higher Education (NIU)**, Kumaracoil, Tamil Nadu.

In university environments containing laboratories (Aeronautical Flight Simulators, Avionics Labs, Chemical & Biomedical Diagnostics), smart classrooms, and lecture halls, physical life-safety must never rely on probabilistic language model predictions. All maintenance intake tickets are scanned against this deterministic matrix prior to and independently of any AI reasoning.

---

## 1. Zero-Override Safety Principle

> **Core Axiom:**
> Once an incident is flagged as a Safety-Critical Hazard by the Deterministic Safety Engine:
> 1. Its priority is permanently locked (e.g. `EMERGENCY` or `CRITICAL`).
> 2. No downstream LLM, LangGraph node, or client UI role emulation can downgrade its priority or remove its safety lock.
> 3. Standard campus switchboard and local emergency guidance (`112` / `101` / `108`) are attached deterministically.
> 4. Priority may only be modified by an authorized facilities supervisor after physical verification.

---

## 2. Hazard Classification Matrix

| Hazard Code | Category | Trigger Patterns & Keywords | Automatic Priority | Mandatory Actions | Emergency Target | SLA Response Limit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SAFE-ELEC-01** | Electrical | `sparking`, `sparks`, `exposed wire`, `exposed wiring`, `electric shock`, `shock hazard`, `outlet smoking`, `panel burning`, `breaker buzzing` | `EMERGENCY` | 1. Lock room breaker notification.<br>2. Dispatch licensed electrician immediately.<br>3. Direct occupants away from electrical hazard. | Campus Switchboard `(+91) 4651-250 566` & State Fire/Emergency `112` / `101` | **15 Minutes** |
| **SAFE-GAS-01** | Chemical & Gas | `gas smell`, `smell of gas`, `rotten egg smell`, `chemical spill`, `mercury`, `acid leak`, `toxic fumes`, `co detector`, `carbon monoxide alarm` | `EMERGENCY` | 1. Trigger building safety warning.<br>2. Generate immediate evacuation checklist.<br>3. Broadcast alert to laboratory supervisor. | Campus Security Switchboard `(+91) 4651-250 566` & Local Fire Safety `101` | **5 Minutes (Immediate)** |
| **SAFE-WATR-01** | Severe Water Inundation | `burst pipe`, `water gushing`, `ceiling collapse`, `flooding near outlet`, `standing water electrical`, `sprinkler leak` | `CRITICAL` | 1. Retrieve main shutoff valve location.<br>2. Assign emergency plumbing team.<br>3. Lockout affected classroom. | Facilities Operations Desk | **30 Minutes** |
| **SAFE-STRU-01** | Structural & Glass | `shattered window`, `broken window pane`, `ceiling tile fallen`, `structural crack`, `loose handrail stairs`, `door lock stuck emergency exit` | `CRITICAL` | 1. Restrict room access in scheduling API.<br>2. Place physical barrier alert.<br>3. Dispatch carpentry / structural team. | Building Operations Lead | **45 Minutes** |
| **SAFE-AIRQ-01** | Air Quality & HVAC Extreme | `black mold visible`, `sewage odor`, `no heat below 55F`, `ac failure server room`, `extreme heat above 88F` | `HIGH` | 1. Check environmental compliance thresholds.<br>2. Dispatch HVAC diagnostic technician.<br>3. Stage portable climate units. | HVAC Operations Supervisor | **2 Hours** |

---

## 3. Verified Emergency Escalation Protocol

In compliance with official NIU public provenance:
- **Campus Main Switchboard:** `(+91) 4651-250 566` / `250 567`
- **Mobile/Helpline:** `+91 94868 56101`
- **National Emergency Number (India):** `112`
- **Fire Services:** `101`
- **Ambulance Services:** `108`

No fictitious internal university hotlines are generated. If internal private dispatcher numbers are unverified, users are directed to the campus security switchboard and national emergency responders.
