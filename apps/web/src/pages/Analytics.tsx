import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../lib/api';
import { AnalyticsOverview } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { NIU_CONFIG } from '../config/institution';

const COLORS = ['#2563EB', '#0D9488', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load analytics.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  const categoryData = Object.entries(data?.issues_by_category || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const buildingData = Object.entries(data?.issues_by_building || {}).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance Analytics & Reporting</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · Operational metrics derived from live database records
          </p>
        </div>
        <button
          onClick={() => {
            if (!data) return;
            const exportPayload = {
              institution: NIU_CONFIG.institutionName,
              campus: `${NIU_CONFIG.campusName} (${NIU_CONFIG.campusCode})`,
              exported_at: new Date().toISOString(),
              metrics: {
                open_requests: data.open_requests,
                in_progress: data.in_progress,
                resolved_today: data.resolved_today,
                critical_safety_incidents: data.critical_safety_incidents,
                average_resolution_hours: data.average_resolution_hours,
                sla_compliance_rate: data.sla_compliance_rate,
                technician_utilization_rate: data.technician_utilization_rate,
              },
              issues_by_category: data.issues_by_category,
              issues_by_building: data.issues_by_building,
              daily_trend: data.daily_trend,
            };
            const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ClassroomCare_NIU_Analytics_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          Export Executive Report
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-slate-500 text-xs flex items-center justify-between font-medium">
            <span>Mean Time to Resolution</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {data?.average_resolution_hours != null ? `${Number(data.average_resolution_hours).toFixed(1)}h` : '0.0h'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Campus Performance Target: &lt;6h</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-slate-500 text-xs flex items-center justify-between font-medium">
            <span>SLA Compliance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-2">
            {data?.sla_compliance_rate != null ? `${data.sla_compliance_rate}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Configurable SLA threshold: 90%</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-slate-500 text-xs flex items-center justify-between font-medium">
            <span>Technician Utilization</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-blue-700 mt-2">
            {data?.technician_utilization_rate != null ? `${data.technician_utilization_rate}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active dispatch queue balance</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-slate-500 text-xs flex items-center justify-between font-medium">
            <span>Critical Safety Incidents</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {data?.critical_safety_incidents || 0}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Deterministic safety rules active</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Incident Distribution by Trade Category
          </h3>
          <div className="h-64 w-full">
            {categoryData.length > 0 && categoryData.some(c => (c.value as number) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                <span>No incidents categorized yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Building Hotspots Bar */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Maintenance Request Frequency by Building
          </h3>
          <div className="h-64 w-full">
            {buildingData.length > 0 && buildingData.some(b => (b.count as number) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Ticket Volume" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <span>No building maintenance hotspots logged yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
