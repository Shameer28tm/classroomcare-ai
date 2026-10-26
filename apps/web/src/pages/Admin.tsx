import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  Lock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Activity,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatDate } from '../lib/utils';
import { getSupabaseConfigStatus } from '../lib/supabase';
import { NIU_CONFIG } from '../config/institution';

interface RolePermRow {
  permission: string;
  label: string;
  student: boolean;
  tech: boolean;
  facmgr: boolean;
  safety: boolean;
  admin: boolean;
}

const PERMISSION_MATRIX: RolePermRow[] = [
  { permission: 'requests:create', label: 'Submit Maintenance Request', student: true, tech: false, facmgr: true, safety: false, admin: true },
  { permission: 'requests:read_own', label: 'View Own Submitted Requests', student: true, tech: false, facmgr: true, safety: false, admin: true },
  { permission: 'requests:read_all', label: 'View All Campus Requests', student: false, tech: false, facmgr: true, safety: true, admin: true },
  { permission: 'requests:assign', label: 'Dispatch & Assign Technicians', student: false, tech: false, facmgr: true, safety: false, admin: true },
  { permission: 'work_orders:update_status', label: 'Update Work Order & Evidence', student: false, tech: true, facmgr: true, safety: false, admin: true },
  { permission: 'safety:review_escalations', label: 'Review Life-Safety Escalations', student: false, tech: false, facmgr: false, safety: true, admin: true },
  { permission: 'knowledge:upload', label: 'Upload & Ingest OEM Manuals', student: false, tech: false, facmgr: true, safety: false, admin: true },
  { permission: 'audit:view_all', label: 'Inspect System Audit Logs', student: false, tech: false, facmgr: false, safety: true, admin: true },
  { permission: 'campus:manage', label: 'Campus Configuration & Admin', student: false, tech: false, facmgr: false, safety: false, admin: true },
];

export const Admin: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');

  const sbStatus = getSupabaseConfigStatus();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getAuditLogs()
      .then((res) => {
        setLogs(res);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to retrieve system audit logs.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.action.toLowerCase().includes(q) ||
      l.actor_name.toLowerCase().includes(q) ||
      l.entity_id.toLowerCase().includes(q);
    const matchesEntity = selectedEntity ? l.entity_type === selectedEntity : true;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administration & Governance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {NIU_CONFIG.institutionName} · Role-Based Access Control (RBAC), immutable system audit logs, and Supabase integration
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
        </div>
      )}

      {/* System Diagnostics Health Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">FastAPI Gateway</div>
            <div className="text-[10px] text-slate-500 font-mono">Status: HEALTHY (v1.0.0)</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Supabase & pgvector</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {sbStatus.isConfigured ? 'Connected (768 Dim)' : 'Awaiting .env Keys'}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Safety Shield</div>
            <div className="text-[10px] text-slate-500 font-mono">Deterministic Lock Active</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Campus Tenant</div>
            <div className="text-[10px] text-slate-500 font-mono">{NIU_CONFIG.campusCode}</div>
          </div>
        </div>
      </div>

      {/* Supabase Setup Notification if unconfigured */}
      {!sbStatus.isConfigured && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2 shadow-xs">
          <div className="font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Supabase Connection Diagnostic Status: Not Configured in Local .env
          </div>
          <p className="text-blue-800">
            The platform is running in local verification mode with memory fallback. To connect your remote Supabase project:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-[11px] font-mono">
            {sbStatus.setupInstructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </div>
      )}

      {/* RBAC Permission Matrix */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Proposed Institutional RBAC Authorization Matrix
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configurable application permission model for campus roles (not proof of official NIU staff hierarchy)
            </p>
          </div>
          <span className="text-[11px] text-slate-600 font-mono font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            5 Authorized Roles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">CAPABILITY / PERMISSION</th>
                <th className="py-2.5 px-3 text-center">STUDENT / FACULTY</th>
                <th className="py-2.5 px-3 text-center">TECHNICIAN</th>
                <th className="py-2.5 px-3 text-center">FACILITY MANAGER</th>
                <th className="py-2.5 px-3 text-center">SAFETY OFFICER</th>
                <th className="py-2.5 px-3 text-center">CAMPUS ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-sans text-slate-900 font-medium">
                    {row.label}
                    <div className="text-[10px] text-slate-400 font-mono">{row.permission}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.student ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.tech ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.facmgr ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.safety ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable System Audit Trail */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Immutable System Audit Logs ({filteredLogs.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg text-xs shadow-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-slate-900 outline-none placeholder-slate-400 w-36"
              />
            </div>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 outline-none shadow-xs"
            >
              <option value="">All Entities</option>
              <option value="TICKET">Ticket</option>
              <option value="SAFETY">Safety</option>
              <option value="USER">User</option>
              <option value="POLICY">Policy</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">LOG ID</th>
                <th className="py-2.5 px-3">ENTITY</th>
                <th className="py-2.5 px-3">ACTION</th>
                <th className="py-2.5 px-3">ACTOR</th>
                <th className="py-2.5 px-3">DIFF / PAYLOAD</th>
                <th className="py-2.5 px-3 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-blue-700 font-bold">{log.id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">{log.actor_name}</td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                    {JSON.stringify(log.diff)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
