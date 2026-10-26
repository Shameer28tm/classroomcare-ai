import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldAlert,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { MaintenanceRequest, AnalyticsOverview } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { SubmitTicketModal } from '../components/tickets/SubmitTicketModal';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer';
import { NIU_CONFIG } from '../config/institution';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const Overview: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentTickets, setRecentTickets] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, ticketsData] = await Promise.all([
        api.getAnalytics(),
        api.getTickets(),
      ]);
      setAnalytics(analyticsData);
      setRecentTickets(ticketsData.slice(0, 5));
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load operations data from database.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const criticalSafetyTickets = recentTickets.filter(t => t.is_safety_hazard && t.status !== 'Resolved');

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  const categoryChartData = Object.entries(analytics?.issues_by_category || {}).map(
    ([name, count]) => ({ name, count })
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Intelligence Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · {NIU_CONFIG.campusName} ({NIU_CONFIG.campusCode})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-xs"
            title="Refresh database metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Maintenance Request
          </button>
        </div>
      </div>

      {/* Database Error Banner if fetch failed */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Connectivity Error: {error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Safety Hazard Warning Banner (If active emergency exists) */}
      {criticalSafetyTickets.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-700 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-950 flex items-center gap-2">
                ACTIVE PHYSICAL SAFETY HAZARD DETECTED
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-full uppercase font-mono">
                  {criticalSafetyTickets[0].hazard_code}
                </span>
              </div>
              <p className="text-xs text-red-800 mt-0.5">
                {criticalSafetyTickets[0].title} in {criticalSafetyTickets[0].building_name} Room{' '}
                {criticalSafetyTickets[0].room_number}. Priority permanently locked to EMERGENCY.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedTicket(criticalSafetyTickets[0])}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs transition-colors"
          >
            Review Emergency Directives
          </button>
        </div>
      )}

      {/* 6 Key Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Tickets</span>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{analytics?.open_requests || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Pending or Triaged</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">{analytics?.in_progress || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active technician dispatch</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Resolved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{analytics?.resolved_today || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">Verified resolutions</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Hazards</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">
            {analytics?.critical_safety_incidents || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Deterministic lockouts</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">SLA Compliance</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {analytics?.sla_compliance_rate != null ? `${analytics.sla_compliance_rate}%` : '0%'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Within target SLA</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">MTTR (Avg)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {analytics?.average_resolution_hours != null ? `${Number(analytics.average_resolution_hours).toFixed(1)}h` : '0.0h'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Mean Time to Resolution</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Velocity Chart */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Weekly Incident Velocity vs. Resolutions
              </h3>
              <p className="text-[11px] text-slate-500">Intake and completion trends from authorized queries</p>
            </div>
            <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Active Term
            </span>
          </div>
          <div className="h-56 w-full">
            {analytics?.daily_trend && analytics.daily_trend.length > 0 && analytics.daily_trend.some(d => (d.reported || 0) > 0 || (d.resolved || 0) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.daily_trend}>
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="reported" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorReported)" name="Reported" />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <span>No maintenance activity recorded over the past 7 days.</span>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance by Category */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Incidents by Equipment Category
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Volume breakdown across trades</p>
            <div className="h-52 w-full">
              {categoryChartData.length > 0 && categoryChartData.some(c => c.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={80} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                  <span>No trade category incidents logged.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Ticket Queue Preview */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Incident Queue & Dispatch Status
            </h3>
            <p className="text-[11px] text-slate-500">Real-time classroom maintenance requests</p>
          </div>
          <Link
            to="/tickets"
            className="text-xs text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
          >
            View Full Queue ({recentTickets.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No active maintenance requests found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">TICKET ID</th>
                  <th className="py-2.5 px-3">LOCATION</th>
                  <th className="py-2.5 px-3">TITLE</th>
                  <th className="py-2.5 px-3">PRIORITY</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">TECHNICIAN</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-blue-700 font-bold">{t.ticket_number}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {t.building_name} · Room {t.room_number}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-medium max-w-xs truncate">{t.title}</td>
                    <td className="py-3 px-3">
                      <Badge variant="priority" value={t.priority}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="status" value={t.status}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {t.assigned_technician_name ? (
                        <span className="font-medium text-slate-900">{t.assigned_technician_name}</span>
                      ) : (
                        <span className="text-amber-700 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs rounded border border-slate-200 font-medium shadow-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <SubmitTicketModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={loadData}
      />

      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={() => {
          loadData();
          if (selectedTicket) {
            api.getTicket(selectedTicket.id).then((t) => setSelectedTicket(t));
          }
        }}
      />
    </div>
  );
};
