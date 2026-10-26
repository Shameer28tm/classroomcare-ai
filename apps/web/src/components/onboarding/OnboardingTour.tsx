/**
 * ClassroomCare AI × NIU
 * Interactive Onboarding Tour (macOS-inspired Dialog)
 * 
 * First-run tutorial introducing:
 * 1. Welcome & Institution Purpose
 * 2. Navigation Architecture
 * 3. Reporting Maintenance Issues & Safety Locking
 * 4. Tracking & Technician Workflows
 * 5. Knowledge Retrieval (RAG) & Citations
 * 6. System Diagnostics & Help Guide
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NIU_CONFIG } from '../../config/institution';

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  keyFeature: string;
  recommendedAction?: {
    label: string;
    route: string;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to ClassroomCare AI',
    subtitle: `Campus Operations Platform for ${NIU_CONFIG.institutionShortName}`,
    icon: Building2,
    description: (
      `ClassroomCare AI is the autonomous maintenance intelligence system designed for ` +
      `Noorul Islam Centre for Higher Education (${NIU_CONFIG.campusName}). It automates issue triage, ` +
      `enforces deterministic life-safety protocols, and accelerates campus repairs.`
    ),
    keyFeature: 'Campus-wide visibility for Kumaracoil facilities with zero data hallucination.',
    recommendedAction: { label: 'Explore Overview Dashboard', route: '/' },
  },
  {
    title: 'Operational Navigation Hub',
    subtitle: 'Streamlined macOS-Style Sidebar',
    icon: Compass,
    description: (
      'The left navigation gives you instant access to 10 unified operational modules: ' +
      'from real-time maintenance requests and technician dispatches to equipment inventories, ' +
      'SLA tracking, and administrative audit trails.'
    ),
    keyFeature: 'Responsive desktop sidebar and touch-friendly mobile drawer.',
  },
  {
    title: 'Submitting Maintenance Requests',
    subtitle: 'Deterministic Safety Classification',
    icon: ClipboardList,
    description: (
      'When reporting issues, select verified campus academic blocks (e.g., Aeronautical & Aerospace, ' +
      'CSE Tech Block, Allied Health Sciences). The system applies deterministic safety rules to ' +
      'immediately escalate electrical, fire, or structural hazards with zero LLM override.'
    ),
    keyFeature: 'Emergency incidents trigger high-visibility alerts with direct switchboard contacts.',
    recommendedAction: { label: 'View Request Queue', route: '/tickets' },
  },
  {
    title: 'Grounded AI Knowledge Assistant (RAG)',
    subtitle: 'Technical Manuals with Strict Citations',
    icon: BookOpen,
    description: (
      'Query verified equipment manuals, chiller specs, and safety SOPs. The RAG assistant ' +
      'grounds every technical recommendation in verified passages with clickable citations, ' +
      'and explicitly abstains when documentation is insufficient.'
    ),
    keyFeature: 'Deterministic fallback ensures 100% availability even without external AI keys.',
    recommendedAction: { label: 'Open Knowledge Base', route: '/knowledge' },
  },
  {
    title: 'Help, Diagnostics & Real Supabase Integration',
    subtitle: 'Transparent Connection Status',
    icon: ShieldCheck,
    description: (
      'Check system health anytime in the Administration and Help pages. Real database queries, ' +
      '6-phase Supabase connection diagnostics, and verified institutional facts keep your operations robust.'
    ),
    keyFeature: 'Granular status diagnostics distinguish process, network, database, and auth phases.',
    recommendedAction: { label: 'Open Help & User Guide', route: '/guide' },
  },
];

export const OnboardingTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if onboarding was completed previously
    const completed = localStorage.getItem('niu_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }

    // Listen for manual restart event
    const handleRestart = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('restart_onboarding_tour', handleRestart);
    return () => window.removeEventListener('restart_onboarding_tour', handleRestart);
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('niu_onboarding_completed', 'true');
    setIsOpen(false);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* macOS-style Window Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            </div>
            <span className="text-xs font-semibold text-slate-600 pl-2">
              ClassroomCare AI — Interactive Orientation
            </span>
          </div>

          <button
            onClick={handleSkip}
            aria-label="Close orientation tour"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {NIU_CONFIG.campusCode}
                </span>
              </div>
              <h2 id="tour-dialog-title" className="text-lg font-bold text-slate-900 mt-1">
                {step.title}
              </h2>
              <p className="text-xs font-medium text-blue-600">
                {step.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
            {step.description}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-3 py-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{step.keyFeature}</span>
          </div>

          {step.recommendedAction && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  navigate(step.recommendedAction!.route);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>{step.recommendedAction.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-2 bg-slate-50/50 flex items-center justify-center gap-1.5 border-t border-slate-100">
          {ONBOARDING_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Go to step ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded transition-colors"
          >
            Skip Orientation
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>{currentStep === ONBOARDING_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStep < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
