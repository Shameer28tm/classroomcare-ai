import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { AgentRun, MaintenanceRequest } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { formatDate } from '../lib/utils';
import { NIU_CONFIG } from '../config/institution';

export const AgentActivity: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rns, tkts] = await Promise.all([
        api.getAgentRuns(),
        api.getTickets(),
      ]);
      setRuns(rns);
      setTickets(tkts);
      if (rns.length > 0 && !selectedRun) {
        setSelectedRun(rns[0]);
      }
      if (tkts.length > 0 && !selectedTicketId) {
        setSelectedTicketId(tkts[0].id);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load agent runs from server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerTriage = async () => {
    if (!selectedTicketId) return;
    setTriaging(true);
    try {
      const newRun = await api.triggerAgentTriage(selectedTicketId);
      setTriaging(false);
      setRuns([newRun, ...runs]);
      setSelectedRun(newRun);
    } catch {
      setTriaging(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Agent Telemetry & Reasoning</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · Deterministic safety assertion, 14-node LangGraph trace, and grounded RAG verification
          </p>
        </div>

        {/* Live Re-Triage Action */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTicketId}
            onChange={(e) => setSelectedTicketId(e.target.value)}
            className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 outline-none shadow-xs"
          >
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ticket_number} - {t.title.slice(0, 32)}...
              </option>
            ))}
          </select>
          <button
            onClick={handleTriggerTriage}
            disabled={triaging || !selectedTicketId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${triaging ? 'animate-spin' : ''}`} />
            {triaging ? 'Executing Agent...' : 'Trigger Agent Triage'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid: Left Run Selector, Right Telemetry Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs History List */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 max-h-[700px] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-blue-600" />
            Execution Traces ({runs.length})
          </h3>

          {runs.map((r) => {
            const isSelected = selectedRun?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRun(r)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                  <span className="text-blue-700 font-bold">{r.id}</span>
                  <span className="text-slate-400">{formatDate(r.started_at)}</span>
                </div>
                <div className="font-semibold text-slate-900 truncate mb-1">
                  {r.decision_summary.slice(0, 50)}...
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  {r.deterministic_safety_hit ? (
                    <span className="text-red-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Safety Override
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Standard Triage
                    </span>
                  )}
                  <span className="text-slate-500">· {r.nodes_executed.length} Nodes</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Run Deep Dive */}
        {selectedRun ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Top Summary Banner */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Decision Summary
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedRun.decision_summary}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                    Priority: {selectedRun.recommended_priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Classified Trade</span>
                  <span className="font-semibold text-slate-800">{selectedRun.recommended_category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Assigned Specialist</span>
                  <span className="font-semibold text-slate-800">{selectedRun.recommended_technician || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Replanning Attempts</span>
                  <span className="font-mono text-slate-800">{selectedRun.replan_count} / 2 (Bounded)</span>
                </div>
              </div>
            </div>

            {/* Citations Card if any */}
            {selectedRun.citations && selectedRun.citations.length > 0 && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Verified Knowledge Base Citations ({selectedRun.citations.length})
                </h4>
                <div className="space-y-2">
                  {selectedRun.citations.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-blue-700 text-[11px]">
                        <span>{c.document_title}</span>
                        <span className="font-mono text-[10px] text-slate-400">{c.chunk_id} · {c.section}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] font-mono leading-relaxed">{c.text_snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 14-Node LangGraph Execution Sequence */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-600" />
                LangGraph State Machine Traversal (14 Explicit Nodes)
              </h4>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
                {selectedRun.nodes_executed.map((node, index) => {
                  const isWarning = node.status === 'WARNING';
                  const isAbstained = node.status === 'ABSTAINED';
                  return (
                    <div key={index} className="relative text-xs">
                      <div
                        className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                          isWarning
                            ? 'bg-red-500'
                            : isAbstained
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      ></div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-bold text-slate-900">{node.node_name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                            isWarning
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isAbstained
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{node.details}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
            Select an agent execution trace from the left panel to inspect the reasoning graph.
          </div>
        )}
      </div>
    </div>
  );
};
