import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  FileText
} from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { Badge } from '../common/Badge';
import { formatDate, formatTimeRemaining } from '../../lib/utils';
import { api } from '../../lib/api';

interface TicketDetailDrawerProps {
  ticket: MaintenanceRequest | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  onClose,
  onUpdated,
}) => {
  const [assigning, setAssigning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState('tech-hvac-001');

  if (!ticket) return null;

  const slaInfo = formatTimeRemaining(ticket.sla_response_due);

  const handleAssign = async () => {
    setAssigning(true);
    setActionError(null);
    try {
      const techName =
        selectedTech === 'tech-hvac-001'
          ? 'Samir Patel (HVAC Certified Tech)'
          : selectedTech === 'tech-elec-002'
          ? 'Elena Rostova (Master Electrician)'
          : 'Carlos Mendez (Lead Facilities Specialist)';

      await api.assignTicket(ticket.id, selectedTech, techName);
      setAssigning(false);
      onUpdated();
    } catch (err: any) {
      setAssigning(false);
      setActionError(err?.message || 'Failed to assign technician');
    }
  };

  const handleVerify = async (approved: boolean) => {
    setVerifying(true);
    setActionError(null);
    try {
      await api.verifyResolution(
        ticket.id,
        approved,
        approved ? 'Verified resolution meets NIU campus facilities standards.' : 'Requires rework.'
      );
      setVerifying(false);
      onUpdated();
    } catch (err: any) {
      setVerifying(false);
      setActionError(err?.message || 'Failed to verify resolution');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {ticket.ticket_number}
              </span>
              <Badge variant="priority" value={ticket.priority}>
                {ticket.priority}
              </Badge>
              <Badge variant="status" value={ticket.status}>
                {ticket.status}
              </Badge>
              {ticket.safety_priority_locked && (
                <Badge variant="safety">SAFETY LOCKED</Badge>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 text-slate-800">
          {/* Action Error Banner */}
          {actionError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
              <span>{actionError}</span>
              <button
                onClick={() => setActionError(null)}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {/* Safety Alert Callout if active */}
          {ticket.is_safety_hazard && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Deterministic Life-Safety Protocol: {ticket.hazard_code}</span>
              </div>
              <p className="text-xs text-red-800">
                This ticket matches emergency safety criteria. Priority is permanently locked to{' '}
                <strong>{ticket.priority}</strong> and cannot be downgraded by AI models.
              </p>
              {ticket.safety_actions && ticket.safety_actions.length > 0 && (
                <div className="mt-2 text-[11px] text-red-900 bg-white p-3 rounded-lg border border-red-200 shadow-xs">
                  <div className="font-semibold text-red-950 mb-1">Mandatory Safety Directives:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-red-800">
                    {ticket.safety_actions.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Context Card */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 text-[11px] flex items-center gap-1 mb-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Location
              </div>
              <div className="font-semibold text-slate-900">
                {ticket.building_name} · Room {ticket.room_number}
              </div>
              {ticket.asset_name && (
                <div className="text-slate-500 text-[10px] mt-0.5">{ticket.asset_name}</div>
              )}
            </div>

            <div>
              <div className="text-slate-500 text-[11px] flex items-center gap-1 mb-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Response SLA Target
              </div>
              <div className="font-semibold text-slate-900">{formatDate(ticket.sla_response_due)}</div>
              <div
                className={`text-[10px] font-mono mt-0.5 ${
                  slaInfo.isPast
                    ? 'text-red-600 font-bold'
                    : slaInfo.isUrgent
                    ? 'text-amber-600 font-medium'
                    : 'text-emerald-700'
                }`}
              >
                {slaInfo.text}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Reported Symptoms & Diagnostics
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Assignment Management */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Technician Assignment
            </h4>
            {ticket.assigned_technician_name ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{ticket.assigned_technician_name}</div>
                  <div className="text-[10px] text-slate-500">Assigned Dispatch</div>
                </div>
                <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-medium">
                  Active Work Order
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-amber-700 font-medium">Pending technician dispatch.</p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2 outline-none shadow-xs"
                  >
                    <option value="tech-hvac-001">Samir Patel (HVAC Certified)</option>
                    <option value="tech-elec-002">Elena Rostova (Master Electrician)</option>
                    <option value="tech-gen-003">Carlos Mendez (Lead Facilities)</option>
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs transition-colors"
                  >
                    {assigning ? 'Dispatching...' : 'Dispatch'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Verification Bar if Awaiting Inspection */}
          {ticket.status === 'Awaiting Inspection' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Wrench className="w-4 h-4 text-blue-600" />
                Work Completed · Pending Manager Verification
              </div>
              <p className="text-xs text-slate-600">
                Technician completed all checklist items and submitted resolution notes.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(true)}
                  disabled={verifying}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Resolution
                </button>
                <button
                  onClick={() => handleVerify(false)}
                  disabled={verifying}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen / Reject
                </button>
              </div>
            </div>
          )}

          {/* Activity Timeline Events */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Event Timeline ({ticket.events?.length || 0})
            </h4>
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
              {ticket.events?.map((evt) => (
                <div key={evt.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800">{evt.actor_name}</span>
                    <span>{formatDate(evt.created_at)}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{evt.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
