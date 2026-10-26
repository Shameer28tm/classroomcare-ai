/**
 * ClassroomCare AI × NIU
 * In-App Help & Comprehensive User Guide Page
 * 
 * Sections:
 * A: Getting Started & Role Architecture
 * B: Core Maintenance Workflows
 * C: AI & RAG Plain-English Guide
 * D: Advanced Administration & Supabase Diagnostics
 * E: Interactive Troubleshooting Wizard
 */

import React, { useState } from 'react';
import {
  Compass,
  ClipboardList,
  Bot,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  Database,
  Building2
} from 'lucide-react';
import { NIU_CONFIG } from '../config/institution';

export const UserGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('a');

  const restartTour = () => {
    window.dispatchEvent(new CustomEvent('restart_onboarding_tour'));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
              Official Reference Guide
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {NIU_CONFIG.campusCode}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            ClassroomCare AI — Platform User Guide & Operations Manual
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Complete beginner-to-advanced operational documentation for facilities maintenance, 
            deterministic safety escalation, RAG telemetry, and Supabase integration at {NIU_CONFIG.institutionName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={restartTour}
            className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Launch Orientation Tour</span>
          </button>
          <a
            href={NIU_CONFIG.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>NIU Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs (macOS Segmented Control Style) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('a')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'a'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Section A: Getting Started</span>
        </button>

        <button
          onClick={() => setActiveTab('b')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'b'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
          <span>Section B: Workflows</span>
        </button>

        <button
          onClick={() => setActiveTab('c')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'c'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span>Section C: AI & RAG</span>
        </button>

        <button
          onClick={() => setActiveTab('d')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'd'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Section D: Advanced</span>
        </button>

        <button
          onClick={() => setActiveTab('e')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'e'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Section E: Troubleshooting</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        {/* SECTION A: GETTING STARTED */}
        {activeTab === 'a' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Section A: Getting Started & Institutional Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Foundational concepts, role responsibilities, and demo sandbox boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  What ClassroomCare AI Does
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ClassroomCare AI is a high-availability campus facilities operations platform. 
                  It connects students, faculty, maintenance engineers, and campus directors into a unified 
                  operational loop. Reports are classified deterministically, assigned according to technician specializations, 
                  and resolved with verifiable evidence and SLA oversight.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Understanding Live vs. Demo Unverified Data
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The client role dropdown is an isolated development testing sandbox. 
                  The identity <strong>Abishek (Facilities Manager)</strong> is explicitly labelled as 
                  an unverified demo record until an authentic administrator provisions official Supabase Auth credentials. 
                  Production security is enforced strictly via PostgreSQL Row Level Security (RLS) and server JWT signatures.
                </p>
              </div>
            </div>

            {/* Role Matrix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Institutional Role Permissions & Responsibilities
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2.5 border border-slate-200">Role</th>
                      <th className="p-2.5 border border-slate-200">Permitted Actions</th>
                      <th className="p-2.5 border border-slate-200">Restricted Boundaries</th>
                      <th className="p-2.5 border border-slate-200">Demo Persona</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 border border-slate-200">Facilities Manager</td>
                      <td className="p-2.5 border border-slate-200">Create, triage, assign tickets, manage facilities, upload docs, review safety alerts</td>
                      <td className="p-2.5 border border-slate-200">Cannot modify root system tenants or bypass DB RLS policies</td>
                      <td className="p-2.5 border border-slate-200 font-mono text-[11px]">Abishek (Demo - Unverified)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 border border-slate-200">Technician</td>
                      <td className="p-2.5 border border-slate-200">View assigned tasks, update status, upload repair evidence, read manuals</td>
                      <td className="p-2.5 border border-slate-200">Cannot assign tickets to others, view unrelated queues, or delete documents</td>
                      <td className="p-2.5 border border-slate-200 font-mono text-[11px]">Assigned Tech (Demo)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 border border-slate-200">Safety Officer</td>
                      <td className="p-2.5 border border-slate-200">Review emergency escalations, acknowledge hazards, view safety audit trails</td>
                      <td className="p-2.5 border border-slate-200">Cannot re-prioritize deterministic life-safety incidents to lower status</td>
                      <td className="p-2.5 border border-slate-200 font-mono text-[11px]">Safety Officer (Demo)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 border border-slate-200">Faculty / Student</td>
                      <td className="p-2.5 border border-slate-200">Submit requests for verified rooms, view status of own reports</td>
                      <td className="p-2.5 border border-slate-200">Cannot view other users' tickets, assign technicians, or edit SLA policies</td>
                      <td className="p-2.5 border border-slate-200 font-mono text-[11px]">Reporter / Faculty (Demo)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: WORKFLOWS */}
        {activeTab === 'b' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Section B: Core Operational Workflows
              </h2>
              <p className="text-xs text-slate-500">
                Step-by-step guides for request submission, technician execution, and resolution signoff.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Submitting a Maintenance Request
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Click <strong>New Maintenance Request</strong> in the top header or Tickets view. Select the verified academic 
                  block (e.g., Aeronautical Engineering Block) and room. Choose the category and description.
                </p>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Deterministic Safety Rule:</strong> If your description contains keywords relating to sparking, smoke, chemical leaks, or structural failure, 
                    the system automatically locks the priority to <strong>EMERGENCY</strong> or <strong>CRITICAL</strong>. This priority cannot be downgraded by any user or AI.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Technician Work Order Processing & Evidence
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  In the <strong>Technician Hub</strong>, technicians view assigned tasks. When beginning work, set the status to <em>In Progress</em>.
                  Upon finishing repairs, technicians upload completion notes, itemize replacement parts, and record photo verification URLs.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submitting evidence advances the ticket to <strong>Awaiting Inspection</strong>, notifying the Facilities Manager for physical sign-off.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Manager Inspection & Ticket Closure
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Facilities Manager Abishek conducts an inspection of the completed work. Approving the resolution marks the ticket <strong>Resolved</strong>. 
                  If defects remain, the manager enters corrective feedback and reopens the work order, maintaining an immutable audit history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: AI & RAG */}
        {activeTab === 'c' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Section C: AI & Retrieval-Augmented Generation (RAG) Explained Simply
              </h2>
              <p className="text-xs text-slate-500">
                How document chunking, hybrid retrieval, citations, and abstention prevent hallucinations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  What is RAG and Why Does It Matter?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Standard AI models generate plausible-sounding text from broad training data, which can invent non-existent manuals or unsafe procedures. 
                  <strong>Retrieval-Augmented Generation (RAG)</strong> constrains the AI to search ONLY approved technical manuals (e.g. Trane Chiller manuals, Daikin VRV guides, NIU safety SOPs) 
                  before formulating an answer.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  Why and When Does the Assistant Abstain?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If you ask a question that is not covered in verified campus manuals (e.g. golf cart repair or unapproved drone flight), 
                  the assistant <strong>explicitly refuses to guess</strong>. It returns a formal abstention notice directing the user 
                  to senior facilities supervisors.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80">
              <h3 className="text-xs font-bold text-blue-900 mb-2">
                100% Operational Availability Without Gemini
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                If the external Google Gemini API is unavailable or unconfigured, ClassroomCare AI automatically falls back 
                to a deterministic verified knowledge synthesizer. You still receive exact passages, manual citations, and safety warnings with zero downtime.
              </p>
            </div>
          </div>
        )}

        {/* SECTION D: ADVANCED */}
        {activeTab === 'd' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Section D: Advanced Facilities, SLA Configuration & Supabase Connection
              </h2>
              <p className="text-xs text-slate-500">
                Managing facilities inventory, configurable SLA deadlines, and database status.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  6-Phase Granular Supabase Connection Diagnostics
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Rather than relying on a superficial HTTP 200 health check, ClassroomCare AI checks 6 distinct phases:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 1:</strong> FastAPI Application Runtime
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 2:</strong> Environment Credentials (.env)
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 3:</strong> Remote Supabase Endpoint Ping
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 4:</strong> PostgreSQL Schema Query
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 5:</strong> Authenticated User Token Check
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <strong>Phase 6:</strong> Data Persistence Roundtrip
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  Configuring SLA Rules
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Default response and resolution deadlines are pre-configured: Emergency (15m response / 2h resolution), 
                  Critical (30m / 6h), High (2h / 24h), Medium (8h / 72h), Low (24h / 168h). 
                  Administrators can adjust these rules in the SLA Monitoring tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: TROUBLESHOOTING */}
        {activeTab === 'e' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Section E: Interactive Troubleshooting Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Instant diagnostic symptoms, root causes, and verifiable resolutions.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  symptom: 'Supabase Status shows "UNCONFIGURED"',
                  cause: 'Local environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing from root .env or contain placeholders.',
                  fix: 'Copy .env.example to .env. Populate SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from your Supabase Dashboard -> Settings -> API. Restart uvicorn.',
                },
                {
                  symptom: 'Knowledge Assistant answers with "Insufficient Documentation"',
                  cause: 'The query asks about equipment or topics not contained within verified campus documents (e.g. Trane Chiller or Panasonic Projector manuals).',
                  fix: 'Upload approved OEM PDF or Markdown documentation via the Knowledge Base upload tool (requires Facilities Manager role).',
                },
                {
                  symptom: 'Ticket Priority Locked to "EMERGENCY"',
                  cause: 'Deterministic safety rules detected life-safety keywords (fire, sparking, chemical leak, structural collapse).',
                  fix: 'This is intended behavior. The deterministic lock protects life safety and cannot be downgraded. Notify the Campus Security Switchboard: (+91) 4651-250 566.',
                },
                {
                  symptom: 'HTTP 403 Forbidden Error when Assigning Technician',
                  cause: 'Active role does not possess the "requests:assign" permission (e.g. Student/Faculty or Technician role).',
                  fix: 'Switch your active role to Facilities Manager or Campus Administrator in the sidebar demo emulation widget.',
                },
                {
                  symptom: 'HTTP 401 Unauthorized Error on API Calls',
                  cause: 'The Authorization Bearer token is missing, expired, or malformed.',
                  fix: 'Re-authenticate via Supabase Auth or verify that your Bearer token is valid.',
                },
                {
                  symptom: 'Gemini Generative Status indicates "BLOCKED"',
                  cause: 'GEMINI_API_KEY is not configured in .env.',
                  fix: 'Add GEMINI_API_KEY=AIzaSy... in .env. ClassroomCare AI continues to operate in deterministic offline mode until configured.',
                },
              ].map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-xs font-bold text-red-800 flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Symptom: {item.symptom}
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    <strong>Cause:</strong> {item.cause}
                  </div>
                  <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                    <strong>Fix:</strong> {item.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
