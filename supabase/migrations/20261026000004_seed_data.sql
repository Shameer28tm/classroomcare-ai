-- Migration: 20261026000004_seed_data.sql
-- Description: Realistic institutional seed fixtures for Noorul Islam Centre for Higher Education (NIU)
-- Note: User identities are explicitly marked as demo / unverified fixtures until provisioned by an authorized administrator.

-- 1. Campus Fixture (Verified Public NIU Campus Details)
INSERT INTO campuses (id, name, code, address, safety_desk_phone, ehs_email)
VALUES (
    'campus-main-01',
    'Noorul Islam Centre for Higher Education',
    'NIU-KUMARACOIL',
    'Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu, India - 629 180',
    '(+91) 4651-250 566',
    'info@niuniv.com'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    address = EXCLUDED.address,
    safety_desk_phone = EXCLUDED.safety_desk_phone,
    ehs_email = EXCLUDED.ehs_email;

-- 2. Profiles (Demo Users across Roles - Explicitly Unverified Demo Fixtures)
INSERT INTO profiles (id, campus_id, email, full_name, role, phone)
VALUES 
    ('usr-facmgr-001', 'campus-main-01', 'demo.facmgr@local.test', 'Abishek (Demo - Unverified)', 'facilities_manager', NULL),
    ('usr-safety-001', 'campus-main-01', 'demo.safety@local.test', 'Safety Officer (Demo - Unverified)', 'safety_officer', NULL),
    ('usr-admin-001', 'campus-main-01', 'demo.admin@local.test', 'Campus Administrator (Demo - Unverified)', 'campus_admin', NULL),
    ('tech-hvac-001', 'campus-main-01', 'demo.tech.hvac@local.test', 'HVAC Technician (Demo)', 'technician', NULL),
    ('tech-elec-002', 'campus-main-01', 'demo.tech.elec@local.test', 'Electrical Technician (Demo)', 'technician', NULL),
    ('usr-faculty-101', 'campus-main-01', 'demo.faculty@local.test', 'Faculty Member (Demo)', 'student_faculty', NULL)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

-- 3. Buildings Fixtures (Derived from Verified NIU Academic Infrastructure)
INSERT INTO buildings (id, campus_id, code, name, floors, emergency_shutoff_coords)
VALUES 
    ('bld-aero-01', 'campus-main-01', 'AERO', 'Aeronautical & Aerospace Engineering Block', 4, 'Ground Floor Utility Core A-1 (Main Breaker)'),
    ('bld-cse-02', 'campus-main-01', 'CSE', 'Computer Science & Engineering Tech Block', 5, 'Server Room Annex B-1 (Panel Sub-2)'),
    ('bld-ahs-03', 'campus-main-01', 'AHS', 'Allied Health Sciences Complex', 4, 'North Corridor Service Shaft C-3'),
    ('bld-lib-04', 'campus-main-01', 'LIB', 'University Central Library', 3, 'Basement Power Room D-1')
ON CONFLICT (id) DO NOTHING;

-- 4. Rooms Fixtures
INSERT INTO rooms (id, campus_id, building_id, room_number, floor, name, capacity, room_type, status)
VALUES 
    ('room-aero-101', 'campus-main-01', 'bld-aero-01', '101', 1, 'Flight Simulator & Avionics Lab', 35, 'Laboratory', 'Available'),
    ('room-aero-204', 'campus-main-01', 'bld-aero-01', '204', 2, 'Aerodynamics Lecture Hall', 120, 'Lecture Hall', 'Available'),
    ('room-cse-302', 'campus-main-01', 'bld-cse-02', '302', 3, 'AI & High Performance Computing Lab', 60, 'Computer Lab', 'Available'),
    ('room-ahs-105', 'campus-main-01', 'bld-ahs-03', '105', 1, 'Biomedical Diagnostic Lab', 40, 'Laboratory', 'Available')
ON CONFLICT (id) DO NOTHING;

-- 5. Equipment Assets (Operational Inventory)
INSERT INTO assets (id, campus_id, room_id, name, category, model_number, serial_number, install_date, warranty_expiry, status, last_inspected_at, next_pm_due)
VALUES 
    ('asset-hvac-01', 'campus-main-01', 'room-aero-204', 'Daikin Central Chiller & Air Handler 12T', 'HVAC', 'DAIKIN-VRV-120', 'SN-DAIKIN-88392-NIU', '2023-01-15', '2028-01-15', 'Operational', '2026-08-10', '2026-11-10'),
    ('asset-proj-02', 'campus-main-01', 'room-aero-204', 'Panasonic PT-MZ880 Laser Projector 8000lm', 'AV/IT', 'PAN-PT-MZ880', 'SN-PAN-44120-NIU', '2023-06-20', '2026-06-20', 'Operational', '2026-06-14', '2026-12-14'),
    ('asset-fume-03', 'campus-main-01', 'room-ahs-105', 'Thermo Fisher Laminar Airflow Biosafety Cabinet', 'Laboratory Equipment', 'TF-BIO-6FT', 'SN-TF-99014-NIU', '2022-04-10', '2027-04-10', 'Operational', '2026-09-01', '2026-11-01')
ON CONFLICT (id) DO NOTHING;

-- 6. Configurable Default SLA Policies
INSERT INTO sla_policies (id, campus_id, priority, response_time_minutes, resolve_time_hours, business_hours_only, escalation_contact)
VALUES 
    ('sla-emer-01', 'campus-main-01', 'EMERGENCY', 15, 2, FALSE, 'Campus Switchboard (+91-4651-250 566) / 112'),
    ('sla-crit-02', 'campus-main-01', 'CRITICAL', 30, 6, FALSE, 'Facilities Lead Desk'),
    ('sla-high-03', 'campus-main-01', 'HIGH', 120, 24, TRUE, 'Area Maintenance Supervisor'),
    ('sla-med-04', 'campus-main-01', 'MEDIUM', 480, 72, TRUE, 'Facilities Dispatch Desk'),
    ('sla-low-05', 'campus-main-01', 'LOW', 1440, 168, TRUE, 'Facilities Dispatch Desk')
ON CONFLICT (id) DO NOTHING;
