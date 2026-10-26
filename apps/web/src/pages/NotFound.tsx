import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';
import { NIU_CONFIG } from '../config/institution';

export const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 shadow-xs">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-mono rounded-full font-semibold">
            HTTP 404 · NOT FOUND
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Route Unrecognized
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The destination <code className="px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded font-mono text-[11px]">{location.pathname}</code> does not correspond to an active operational module in the ClassroomCare AI suite.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-left text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Campus Scope</div>
          <div className="text-slate-500 text-[11px]">{NIU_CONFIG.institutionName} · {NIU_CONFIG.campusName}</div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Operations Console
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/tickets"
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
              Ticket Queue
            </Link>
            <Link
              to="/guide"
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              User Manual
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
