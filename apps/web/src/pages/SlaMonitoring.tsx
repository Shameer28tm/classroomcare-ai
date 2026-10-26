import React, { useState, useEffect } from 'react';
import {
  Clock,
  PhoneCall,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { MaintenanceRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatTimeRemaining, formatDate } from '../lib/utils';
import { NIU_CONFIG } from '../config/institution';

export const SlaMonitoring: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getTickets()
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load tickets for SLA tracking.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  const activeTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">SLA Monitoring & Escalation Center</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {NIU_CONFIG.institutionName} · Tiered response deadlines, upcoming breach alerts, and escalation roster
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

      {/* SLA Policy Tiers Reference Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Configurable Operational SLA Tiers (Baseline Rules)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium italic">
            Configurable Application Defaults (Not official university mandate)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs font-bold text-red-700">EMERGENCY</div>
            <div className="text-lg font-bold font-mono text-red-950 mt-1">15 Mins</div>
            <div className="text-[10px] text-slate-600">Resolution: 2 Hours</div>
            <div className="text-[10px] text-red-700 mt-2 font-semibold">Immediate Safety Protocol</div>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="text-xs font-bold text-rose-700">CRITICAL</div>
            <div className="text-lg font-bold font-mono text-rose-950 mt-1">30 Mins</div>
            <div className="text-[10px] text-slate-600">Resolution: 6 Hours</div>
            <div className="text-[10px] text-rose-700 mt-2 font-medium">24/7 Facilities Desk</div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs font-bold text-amber-800">HIGH</div>
            <div className="text-lg font-bold font-mono text-amber-950 mt-1">2 Hours</div>
            <div className="text-[10px] text-slate-600">Resolution: 24 Hours</div>
            <div className="text-[10px] text-amber-800 mt-2 font-medium">Trade Supervisor</div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-bold text-blue-700">MEDIUM</div>
            <div className="text-lg font-bold font-mono text-blue-950 mt-1">8 Hours</div>
            <div className="text-[10px] text-slate-600">Resolution: 72 Hours</div>
            <div className="text-[10px] text-blue-700 mt-2 font-medium">Standard Work Order</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-700">LOW</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">24 Hours</div>
            <div className="text-[10px] text-slate-600">Resolution: 7 Days</div>
            <div className="text-[10px] text-slate-600 mt-2 font-medium">Scheduled Routine PM</div>
          </div>
        </div>
      </div>

      {/* Live SLA Countdown Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Requests SLA Countdown ({activeTickets.length})
          </h3>
          <span className="text-[11px] text-blue-700 font-mono font-semibold">Real-time Deadlines</span>
        </div>

        {activeTickets.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            All active maintenance requests have been resolved within target SLA.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">TICKET</th>
                  <th className="py-2.5 px-3">PRIORITY</th>
                  <th className="py-2.5 px-3">LOCATION</th>
                  <th className="py-2.5 px-3">TITLE</th>
                  <th className="py-2.5 px-3">RESPONSE DUE</th>
                  <th className="py-2.5 px-3">COUNTDOWN</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTickets.map((t) => {
                  const sla = formatTimeRemaining(t.sla_response_due);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{t.ticket_number}</td>
                      <td className="py-3 px-3">
                        <Badge variant="priority" value={t.priority}>
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {t.building_name} · Room {t.room_number}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-medium max-w-xs truncate">{t.title}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{formatDate(t.sla_response_due)}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            sla.isPast
                              ? 'text-red-600'
                              : sla.isUrgent
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="status" value={t.status}>
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* On-Call Escalation Roster Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          Escalation Contacts & Institutional Switchboard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">Campus Switchboard</div>
            <div className="text-[11px] text-slate-500">Official NIU Reception & Security Desk</div>
            <div className="text-blue-700 font-mono text-[11px] font-semibold mt-1">
              {NIU_CONFIG.switchboardPhone}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">{NIU_CONFIG.facilitiesLead.displayName}</div>
            <div className="text-[11px] text-slate-500">{NIU_CONFIG.facilitiesLead.role} (Demo - Unverified)</div>
            <div className="text-slate-500 text-[10px] mt-1 italic">
              Awaiting Administrator Provisioning
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">Emergency Services</div>
            <div className="text-[11px] text-slate-500">National Emergency Protocol</div>
            <div className="text-red-700 font-mono text-[11px] font-bold mt-1">
              {NIU_CONFIG.emergencyDesk.emergencyServices}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
