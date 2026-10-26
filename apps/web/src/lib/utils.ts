import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatTimeRemaining(dueIso?: string): { text: string; isPast: boolean; isUrgent: boolean } {
  if (!dueIso) return { text: '—', isPast: false, isUrgent: false };
  try {
    const now = new Date().getTime();
    const target = new Date(dueIso).getTime();
    const diffMs = target - now;
    const isPast = diffMs < 0;
    const absDiffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));

    if (absDiffMinutes < 60) {
      return {
        text: `${absDiffMinutes}m ${isPast ? 'overdue' : 'left'}`,
        isPast,
        isUrgent: !isPast && absDiffMinutes <= 30,
      };
    }
    const hours = Math.floor(absDiffMinutes / 60);
    const mins = absDiffMinutes % 60;
    return {
      text: `${hours}h ${mins}m ${isPast ? 'overdue' : 'left'}`,
      isPast,
      isUrgent: !isPast && hours < 2,
    };
  } catch {
    return { text: '—', isPast: false, isUrgent: false };
  }
}

export function getPriorityBadgeColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'EMERGENCY':
      return 'bg-red-50 text-red-700 border-red-300 font-bold animate-pulse';
    case 'CRITICAL':
      return 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
    case 'HIGH':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    case 'LOW':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  }
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
    case 'In Progress':
      return 'bg-sky-50 text-sky-800 border-sky-300 font-medium';
    case 'Assigned':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium';
    case 'Awaiting Parts':
    case 'Awaiting Inspection':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
    case 'Triage':
    case 'Submitted':
      return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200 font-medium';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  }
}
