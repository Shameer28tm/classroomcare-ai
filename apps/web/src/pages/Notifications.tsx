import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Wrench,
  Clock,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { Notification } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../lib/utils';
import { NIU_CONFIG } from '../config/institution';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    setActionError(null);
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update notification state');
    }
  };

  const handleMarkAllRead = async () => {
    setActionError(null);
    try {
      for (const n of notifications) {
        if (!n.read) {
          await api.markNotificationRead(n.id);
        }
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to mark all notifications as read');
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  const displayed = filterUnread ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · Emergency safety broadcasts, SLA warnings, and dispatch updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={filterUnread}
              onChange={(e) => setFilterUnread(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Unread Only</span>
          </label>
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            Mark All as Read
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
            onClick={fetchNotifs}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between gap-2">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="Your alert stream is clean. Safety alerts and dispatch updates will appear here in real time."
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((n) => {
            const isSafety = n.category === 'SAFETY_EMERGENCY';
            const isSla = n.category === 'SLA_BREACH';
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all shadow-xs ${
                  !n.read
                    ? isSafety
                      ? 'bg-red-50 border-red-200 text-red-950'
                      : 'bg-blue-50/60 border-blue-200 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      isSafety
                        ? 'bg-red-100 text-red-700'
                        : isSla
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isSafety ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isSla ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{n.message}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                      {formatDate(n.created_at)}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] rounded border border-slate-200 font-medium shrink-0 shadow-xs transition-colors"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
