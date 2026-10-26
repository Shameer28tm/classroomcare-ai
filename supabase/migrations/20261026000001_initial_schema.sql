-- Migration: 20261026000001_initial_schema.sql
-- Description: Core relational schema for ClassroomCare AI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campuses
CREATE TABLE IF NOT EXISTS campuses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    safety_desk_phone VARCHAR(64) NOT NULL,
    ehs_email VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('student_faculty', 'technician', 'facilities_manager', 'safety_officer', 'campus_admin')),
    phone VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    floors INT NOT NULL DEFAULT 1,
    emergency_shutoff_coords TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms / Classrooms
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    building_id VARCHAR(64) REFERENCES buildings(id) ON DELETE CASCADE,
    room_number VARCHAR(32) NOT NULL,
    floor INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 30,
    room_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Assets
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    model_number VARCHAR(128) NOT NULL,
    serial_number VARCHAR(128) NOT NULL UNIQUE,
    install_date DATE,
    warranty_expiry DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'Operational',
    last_inspected_at TIMESTAMPTZ,
    next_pm_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    building_id VARCHAR(64) REFERENCES buildings(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE SET NULL,
    requester_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_technician_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('Submitted', 'Triage', 'Assigned', 'In Progress', 'Awaiting Parts', 'Awaiting Inspection', 'Resolved', 'Closed', 'Rejected')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_safety_hazard BOOLEAN NOT NULL DEFAULT FALSE,
    hazard_code VARCHAR(64),
    safety_priority_locked BOOLEAN NOT NULL DEFAULT FALSE,
    safety_actions JSONB DEFAULT '[]'::jsonb,
    sla_response_due TIMESTAMPTZ NOT NULL,
    sla_resolve_due TIMESTAMPTZ NOT NULL,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE CASCADE UNIQUE,
    assigned_technician_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    safety_checklist JSONB DEFAULT '[]'::jsonb,
    work_instructions JSONB DEFAULT '[]'::jsonb,
    parts_used JSONB DEFAULT '[]'::jsonb,
    work_notes TEXT DEFAULT '',
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    verified_by_requester BOOLEAN DEFAULT FALSE,
    verified_by_manager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request Events (Timeline)
CREATE TABLE IF NOT EXISTS request_events (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA Policies
CREATE TABLE IF NOT EXISTS sla_policies (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    priority VARCHAR(32) NOT NULL,
    response_time_minutes INT NOT NULL,
    resolve_time_hours INT NOT NULL,
    business_hours_only BOOLEAN NOT NULL DEFAULT FALSE,
    escalation_contact VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    ticket_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    diff JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_campus ON maintenance_requests(campus_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_building_room ON maintenance_requests(building_id, room_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned ON maintenance_requests(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_events_ticket ON request_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_campus ON audit_logs(campus_id, entity_type);
