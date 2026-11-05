'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, ShieldCheck, Layers, BarChart3, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  targetPath?: string;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "1. Intelligent Ingestion & Evidence Vault",
    subtitle: "Native & OCR Ingestion",
    description: "Every uploaded insurance PDF is classified and inspected across 10 quality vectors. The hybrid router dynamically directs clean digital pages to PyMuPDF and degraded scans to high-accuracy OCR.",
    icon: Layers,
    badge: "Step 1 of 3",
    targetPath: "/documents"
  },
  {
    title: "2. Precision Spatial Reticle & Review",
    subtitle: "Auditable Ground Truth Provenance",
    description: "Fields extracted by models are spatially localized on document pages using PyMuPDF polygon quads. If confidence dips below 0.85 or text cannot be located, it escalates to the Human Review Station.",
    icon: Crosshair,
    badge: "Step 2 of 3",
    targetPath: "/review"
  },
  {
    title: "3. Benchmarks, Telemetry & Cost Accounting",
    subtitle: "Measurable Accuracy & Unit Economics",
    description: "Evaluate extraction pipelines against 40 verified ground-truth documents. Track true hallucination vs mismatch rates, and compare measured API cost against modeled manual human review overhead.",
    icon: BarChart3,
    badge: "Step 3 of 3",
    targetPath: "/evaluation"
  }
];

export function GuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const completed = localStorage.getItem('provenance_tour_completed');
      if (!completed) {
        // Auto open on first visit
        setIsOpen(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('provenance_tour_completed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setCurrentStep(0); }}
        className="fixed bottom-4 right-4 z-40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all"
        title="Open Guided Product Tour"
      >
        <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        <span className="hidden sm:inline">Product Tour</span>
      </button>
    );
  }

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F1420] border border-white/[0.12] rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/25 font-semibold">
              {step.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Provenance Platform Architecture
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center flex-shrink-0">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">{step.subtitle}</p>
              <h3 className="text-base font-semibold text-white mt-0.5">{step.title}</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-xl">
            {step.description}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-sky-400' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-white/[0.08]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-slate-400 border-white/[0.1] hover:bg-white/[0.05]"
            >
              Skip
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="text-xs font-medium"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

