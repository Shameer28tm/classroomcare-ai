import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ShieldAlert,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { MaintenanceRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { SubmitTicketModal } from '../components/tickets/SubmitTicketModal';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer';
import { formatTimeRemaining } from '../lib/utils';
import { NIU_CONFIG } from '../config/institution';

export const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTickets({
        category: selectedCategory || undefined,
        priority: selectedPriority || undefined,
        status: selectedStatus || undefined,
      });
      setTickets(data);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tickets from server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedCategory, selectedPriority, selectedStatus]);

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.ticket_number.toLowerCase().includes(q) ||
      t.building_name.toLowerCase().includes(q) ||
      t.room_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance Request Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.campusName} · Operational triage, safety overrides, and dispatch records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors shadow-xs"
            title="Refresh Queue"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Error state if server call fails */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Request Failed: {error}</span>
          </div>
          <button
            onClick={fetchTickets}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, room, or issue description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 outline-none shadow-xs"
          >
            <option value="">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="HVAC">HVAC</option>
            <option value="Networking">Networking</option>
            <option value="Laboratory Equipment">Lab Equipment</option>
            <option value="Structural">Structural</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 outline-none shadow-xs"
          >
            <option value="">All Priorities</option>
            <option value="EMERGENCY">Emergency (Life Safety)</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 outline-none shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Inspection">Awaiting Inspection</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="No Maintenance Tickets Found"
          description="No requests match your current search and filter criteria. You can create a new request or adjust your filters."
          action={{
            label: 'Submit First Request',
            onClick: () => setIsSubmitOpen(true),
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">TICKET</th>
                  <th className="py-3 px-4">LOCATION</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">PRIORITY</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">SLA TARGET</th>
                  <th className="py-3 px-4">ASSIGNED TECH</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const sla = formatTimeRemaining(t.sla_response_due);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {t.ticket_number}
                        {t.safety_priority_locked && (
                          <span className="ml-2 inline-flex items-center text-[10px] text-red-600" title="Deterministic Safety Locked">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-900">{t.building_name}</div>
                        <div className="text-[11px] text-slate-500">Room {t.room_number}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{t.category}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="priority" value={t.priority}>
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="status" value={t.status}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span
                          className={
                            sla.isPast
                              ? 'text-red-600 font-bold'
                              : sla.isUrgent
                              ? 'text-amber-600 font-semibold'
                              : 'text-emerald-700 font-medium'
                          }
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.assigned_technician_name || (
                          <span className="text-amber-700 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs rounded border border-slate-200 font-medium shadow-xs transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals & Detail Drawer */}
      <SubmitTicketModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={fetchTickets}
      />

      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={() => {
          fetchTickets();
          if (selectedTicket) {
            api.getTicket(selectedTicket.id).then((t) => setSelectedTicket(t));
          }
        }}
      />
    </div>
  );
};
