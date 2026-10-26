import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Play,
  Upload,
  CheckSquare,
  Square,
  Package,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { MaintenanceRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const TechnicianWorkspace: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Work Execution Form State
  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: 'c1', label: 'Lockout / Tagout (LOTO) verified at electrical panel', checked: false },
    { id: 'c2', label: 'Personal Protective Equipment (PPE) donned (Gloves, Eye Protection)', checked: false },
    { id: 'c3', label: 'Airflow / Pressure diagnostics tested against OEM specifications', checked: false },
    { id: 'c4', label: 'Classroom space cleared of debris and safety hazards', checked: false },
  ]);

  const [partNumber, setPartNumber] = useState('TRN-BLT-B54');
  const [partQty, setPartQty] = useState(1);
  const [workNotes, setWorkNotes] = useState('Cleaned intake filters, adjusted V-belt tension to 0.5" deflection, verified cooling cycle.');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const allTickets = await api.getTickets();
      // Show assigned or in-progress tickets
      const assigned = allTickets.filter(
        (t) => t.assigned_technician_id || t.status === 'Assigned' || t.status === 'In Progress'
      );
      setTickets(assigned);
      if (assigned.length > 0 && !selectedTicket) {
        setSelectedTicket(assigned[0]);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load technician work orders.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleStartWork = async () => {
    if (!selectedTicket) return;
    setFormError(null);
    try {
      const updated = await api.updateTicketStatus(selectedTicket.id, 'In Progress', 'Technician started physical repairs.');
      setSelectedTicket(updated);
      await fetchWorkOrders();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update work order status to In Progress.');
    }
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await api.recordEvidence(selectedTicket.id, {
        notes: workNotes,
        parts_used: [{ part_number: partNumber, quantity: partQty }],
        evidence_urls: ['https://storage.campus.edu/evidence/repair_confirmed.jpg'],
        checklist_completed: checklist.every((c) => c.checked),
      });
      setSelectedTicket(updated);
      setSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      await fetchWorkOrders();
    } catch (err: any) {
      setSubmitting(false);
      setFormError(err?.message || 'Failed to record maintenance evidence.');
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Technician Workbench</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active dispatched work orders, OEM grounded procedures, and resolution evidence logging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Active Technician:</span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            Assigned Facilities Dispatch
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
          <button
            onClick={fetchWorkOrders}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <EmptyState
          title="No Active Work Orders Assigned"
          description="You currently have zero pending work orders. Check the main maintenance queue to accept incoming dispatches."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Orders List (Left) */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              Assigned Dispatches ({tickets.length})
            </h3>
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-blue-700 font-bold">{t.ticket_number}</span>
                    <Badge variant="priority" value={t.priority}>
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-900 truncate mb-1">{t.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {t.building_name} · Room {t.room_number}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Work Order Action Panel (Right) */}
          {selectedTicket ? (
            <div className="lg:col-span-2 space-y-4">
              {/* Order Header */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedTicket.ticket_number}
                      </span>
                      <Badge variant="status" value={selectedTicket.status}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{selectedTicket.title}</h2>
                  </div>

                  {selectedTicket.status === 'Assigned' && (
                    <button
                      onClick={handleStartWork}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Work
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">Location & Room</span>
                    <span className="font-semibold text-slate-900">
                      {selectedTicket.building_name} · Room {selectedTicket.room_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">Target Asset</span>
                    <span className="font-semibold text-slate-900">
                      {selectedTicket.asset_name || 'General Equipment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Directives Callout if Safety Critical */}
              {selectedTicket.is_safety_hazard && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Mandatory Safety Directives ({selectedTicket.hazard_code})
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-800 space-y-0.5">
                    {selectedTicket.safety_actions?.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Safety Checklist */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Pre-Service Safety & Diagnostic Checklist
                </h3>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition-colors ${
                        item.checked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parts & Evidence Submission Form */}
              <form onSubmit={handleSubmitResolution} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  Record Parts Used & Resolution Notes
                </h3>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormError(null)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Resolution submitted successfully! Ticket transitioned to Awaiting Inspection.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Part Number / Component
                    </label>
                    <input
                      type="text"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none font-mono shadow-xs focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none font-mono shadow-xs focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Technical Work Notes & Actions Taken *
                  </label>
                  <textarea
                    rows={3}
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none shadow-xs focus:border-blue-600"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Photo Evidence: repair_confirmed.jpg attached</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Complete & Request Verification'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
              Select a work order from the left to view instructions and record evidence.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
