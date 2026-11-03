'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Check, 
  Edit3, 
  X, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  Target,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HumanReviewPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getReviewQueue('pending');
      setTasks(res.tasks || []);
      if (res.tasks && res.tasks.length > 0) {
        setSelectedTask(res.tasks[0]);
        setCorrectionValue(res.tasks[0].extracted_value || '');
      } else {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Timer simulating operator review time tracking for loaded cost accounting
  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTask?.task_id]);

  const handleSelectTask = (task: any) => {
    setSelectedTask(task);
    setCorrectionValue(task.extracted_value || '');
    setCorrectionNotes('');
  };

  const handleAccept = async () => {
    if (!selectedTask) return;
    try {
      setSubmitting(true);
      await api.acceptReview(selectedTask.task_id);
      await loadQueue();
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      setSubmitting(true);
      await api.correctReview(selectedTask.task_id, correctionValue, correctionNotes);
      await loadQueue();
    } catch (err: any) {
      alert(`Correction failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Human-In-The-Loop Adjudication
            </span>
            <span className="text-textMuted text-xs">·</span>
            <span className="text-xs text-textSecondary font-mono">
              Audit Rate: $35.00/hr loaded
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Human Review Station
          </h1>
          <p className="text-xs text-textSecondary mt-1 max-w-2xl">
            Adjudicate uncertain fields, low OCR confidence tokens, and cross-field validation flags with immutable audit trail preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-cyan-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Timer: {elapsedSeconds}s</span>
          </div>
          <button
            onClick={loadQueue}
            className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-textSecondary hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="p-16 text-center glass-panel border border-white/[0.08] rounded-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-glow-emerald">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-base font-bold text-white font-mono">Review Station Queue Clear</h2>
          <p className="text-xs text-textMuted mt-1 max-w-md mx-auto">
            Zero fields currently require human operator intervention. All documents either passed confidence thresholds (≥0.90) or have been verified.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Task Queue Column (5 cols) */}
          <div className="col-span-12 lg:col-span-5 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-textMuted px-1 font-mono mb-1">
              <span>PENDING ESCALATIONS</span>
              <span className="text-amber-300 font-semibold">{tasks.length} items</span>
            </div>

            {tasks.map((t) => {
              const isSelected = selectedTask?.task_id === t.task_id;
              return (
                <div
                  key={t.task_id}
                  onClick={() => handleSelectTask(t)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-glow-cyan'
                      : 'border-white/[0.07] glass-card hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-cyan-400" />
                      <span>{t.field_name}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {t.extracted_value ? t.extracted_value : <span className="text-textMuted italic font-normal">[Missing]</span>}
                  </div>
                  <div className="text-[11px] text-textMuted mt-1.5 flex items-center justify-between font-mono">
                    <span className="truncate max-w-[210px] text-slate-400">{t.document_filename}</span>
                    <span className="text-amber-400 font-medium">{Math.round(t.confidence_score * 100)}% conf</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adjudication Workbench Column (7 cols) */}
          {selectedTask && (
            <div className="col-span-12 lg:col-span-7 p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-6 shadow-float">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">Active Review Target</span>
                  <h2 className="text-lg font-bold text-white font-mono">{selectedTask.field_name}</h2>
                </div>
                <Link
                  href={`/documents/${selectedTask.document_id}`}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-xs text-cyan-300 border border-cyan-500/30 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span>Inspect Full Document Stage</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Escalation Reason Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 font-mono">Escalation Trigger:</span> {selectedTask.reason}
                </div>
              </div>

              {/* Source Document Context Evidence */}
              <div>
                <label className="text-xs font-mono text-textSecondary uppercase tracking-wider block mb-1.5">
                  Spatial Document Evidence Snippet
                </label>
                <div className="p-3.5 rounded-xl bg-[#07090E] border border-white/[0.08] text-xs font-mono text-cyan-300 leading-relaxed shadow-inner">
                  {selectedTask.evidence_text ? (
                    <span>&ldquo;{selectedTask.evidence_text}&rdquo;</span>
                  ) : (
                    <span className="text-textMuted italic font-normal">No bounding box evidence captured by primary engine.</span>
                  )}
                </div>
                <div className="text-[11px] text-textMuted mt-1.5 font-mono flex items-center justify-between">
                  <span>Target: <span className="text-slate-300">{selectedTask.document_filename}</span></span>
                  <span className="text-cyan-400">Page {selectedTask.page_number}</span>
                </div>
              </div>

              {/* Current Machine Extraction */}
              <div>
                <label className="text-xs font-mono text-textSecondary uppercase tracking-wider block mb-1.5">
                  Machine Extracted Candidate
                </label>
                <div className="text-sm font-bold text-white p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono">
                  {selectedTask.extracted_value || <span className="text-textMuted italic font-normal">[Missing]</span>}
                </div>
              </div>

              {/* Form Actions */}
              <form onSubmit={handleCorrect} className="space-y-4 pt-3 border-t border-white/[0.07]">
                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">
                    Verified Correct Value <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={correctionValue}
                    onChange={(e) => setCorrectionValue(e.target.value)}
                    required
                    placeholder="Input human-audited correct value..."
                    className="w-full p-3 rounded-xl bg-[#07090E] border border-white/[0.12] text-xs font-mono text-white placeholder-textMuted focus:outline-none focus:border-cyan-400 focus:shadow-glow-cyan transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-textSecondary block mb-1.5 font-mono">
                    Audit Rationale / Document Provenance Notes
                  </label>
                  <input
                    type="text"
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    placeholder="e.g. Verified against physical policy schedule endorsement on page 2"
                    className="w-full p-3 rounded-xl bg-[#07090E] border border-white/[0.08] text-xs text-white placeholder-textMuted focus:outline-none focus:border-white/[0.2] transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={submitting || !selectedTask.extracted_value}
                    className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Machine Extraction</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !correctionValue}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-glow-cyan disabled:opacity-40"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                    <span>Commit Human Correction</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
