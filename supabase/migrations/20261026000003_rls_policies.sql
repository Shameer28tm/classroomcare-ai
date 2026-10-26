-- Migration: 20261026000003_rls_policies.sql
-- Description: Row Level Security (RLS) policies and campus-aware data isolation

-- Enable RLS on core tables
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user's campus_id from profile
CREATE OR REPLACE FUNCTION get_auth_campus_id()
RETURNS VARCHAR(64) AS $$
    SELECT campus_id FROM profiles WHERE id = auth.uid()::text;
$$ LANGUAGE sql STABLE;

-- Helper function to extract user's role from profile
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS VARCHAR(32) AS $$
    SELECT role FROM profiles WHERE id = auth.uid()::text;
$$ LANGUAGE sql STABLE;

-- 1. Maintenance Requests RLS Policies
-- Read Policy
DROP POLICY IF EXISTS "Campus isolated read for maintenance requests" ON maintenance_requests;
CREATE POLICY "Campus isolated read for maintenance requests"
ON maintenance_requests FOR SELECT
USING (
    campus_id = get_auth_campus_id()
    AND (
        get_auth_role() IN ('facilities_manager', 'safety_officer', 'campus_admin')
        OR (get_auth_role() = 'technician' AND (assigned_technician_id = auth.uid()::text OR status = 'Submitted'))
        OR (get_auth_role() = 'student_faculty' AND requester_id = auth.uid()::text)
    )
);

-- Insert Policy
DROP POLICY IF EXISTS "Authorized users can submit maintenance requests" ON maintenance_requests;
CREATE POLICY "Authorized users can submit maintenance requests"
ON maintenance_requests FOR INSERT
WITH CHECK (
    campus_id = get_auth_campus_id()
    AND requester_id = auth.uid()::text
);

-- Update Policy (Managers, Admins, or assigned technicians)
DROP POLICY IF EXISTS "Managers and assigned technicians can update requests" ON maintenance_requests;
CREATE POLICY "Managers and assigned technicians can update requests"
ON maintenance_requests FOR UPDATE
USING (
    campus_id = get_auth_campus_id()
    AND (
        get_auth_role() IN ('facilities_manager', 'campus_admin')
        OR (get_auth_role() = 'technician' AND assigned_technician_id = auth.uid()::text)
    )
);

-- 2. Work Orders RLS Policies
DROP POLICY IF EXISTS "Work orders read access" ON work_orders;
CREATE POLICY "Work orders read access"
ON work_orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM maintenance_requests r
        WHERE r.id = work_orders.ticket_id
        AND r.campus_id = get_auth_campus_id()
        AND (
            get_auth_role() IN ('facilities_manager', 'campus_admin')
            OR (get_auth_role() = 'technician' AND work_orders.assigned_technician_id = auth.uid()::text)
        )
    )
);

DROP POLICY IF EXISTS "Technicians can update assigned work orders" ON work_orders;
CREATE POLICY "Technicians can update assigned work orders"
ON work_orders FOR UPDATE
USING (
    assigned_technician_id = auth.uid()::text
    OR get_auth_role() IN ('facilities_manager', 'campus_admin')
);

-- 3. Knowledge Documents RLS Policies
DROP POLICY IF EXISTS "Campus members can read approved knowledge documents" ON knowledge_documents;
CREATE POLICY "Campus members can read approved knowledge documents"
ON knowledge_documents FOR SELECT
USING (campus_id = get_auth_campus_id());

DROP POLICY IF EXISTS "Managers and Admins can upload knowledge documents" ON knowledge_documents;
CREATE POLICY "Managers and Admins can upload knowledge documents"
ON knowledge_documents FOR INSERT
WITH CHECK (
    campus_id = get_auth_campus_id()
    AND get_auth_role() IN ('facilities_manager', 'campus_admin')
);

-- 4. Notifications RLS Policies
DROP POLICY IF EXISTS "Users can only read own notifications" ON notifications;
CREATE POLICY "Users can only read own notifications"
ON notifications FOR SELECT
USING (
    user_id = auth.uid()::text
    OR (user_id = 'safety-officer-broadcast' AND get_auth_role() IN ('safety_officer', 'facilities_manager', 'campus_admin'))
);

-- 5. Audit Logs RLS Policies
DROP POLICY IF EXISTS "Audit logs visible to safety officers, managers, and admins" ON audit_logs;
CREATE POLICY "Audit logs visible to safety officers, managers, and admins"
ON audit_logs FOR SELECT
USING (
    campus_id = get_auth_campus_id()
    AND get_auth_role() IN ('safety_officer', 'facilities_manager', 'campus_admin')
);
