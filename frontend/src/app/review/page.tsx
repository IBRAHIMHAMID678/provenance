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
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HumanReviewPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Human Review Workspace</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Adjudicate low-confidence fields, cross-field validation flags, and missing required identifiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-mutedText font-mono">
            {tasks.length} pending items
          </span>
          <button
            onClick={loadQueue}
            className="p-1.5 rounded-md border border-borderLight bg-surface text-mutedText hover:text-graphite text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-borderLight rounded-lg">
          <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-graphite">Review Queue Clear</h2>
          <p className="text-xs text-mutedText mt-1 max-w-sm mx-auto">
            Zero fields currently require human operator intervention. All documents either passed confidence thresholds or are pending extraction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Task List (5 cols) */}
          <div className="col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {tasks.map((t) => {
              const isSelected = selectedTask?.task_id === t.task_id;
              return (
                <div
                  key={t.task_id}
                  onClick={() => handleSelectTask(t)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-charcoal bg-surface shadow-sm'
                      : 'border-borderLight bg-surface hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-mutedText font-semibold text-[11px]">
                      {t.field_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      {t.priority} priority
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-graphite truncate">
                    {t.extracted_value ? t.extracted_value : <span className="text-neutral-400 italic">[Missing]</span>}
                  </div>
                  <div className="text-[11px] text-mutedText mt-1 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{t.document_filename}</span>
                    <span className="font-mono text-amber-600">{Math.round(t.confidence_score * 100)}% conf</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adjudication Workspace (7 cols) */}
          {selectedTask && (
            <div className="col-span-7 p-6 rounded-lg bg-surface border border-borderLight space-y-5">
              <div className="flex items-center justify-between border-b border-borderLight pb-3">
                <div>
                  <span className="text-xs font-mono text-mutedText uppercase">Field In Review</span>
                  <h2 className="text-base font-bold text-graphite">{selectedTask.field_name}</h2>
                </div>
                <Link
                  href={`/documents/${selectedTask.document_id}`}
                  className="text-xs text-graphite hover:underline font-medium"
                >
                  View Full PDF →
                </Link>
              </div>

              {/* Flag Reason Alert */}
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Review Escalation Reason:</span> {selectedTask.reason}
                </div>
              </div>

              {/* Source Document Evidence Snippet */}
              <div>
                <label className="text-xs font-medium text-mutedText block mb-1">Source Document Evidence</label>
                <div className="p-3 rounded-md bg-stone-50 border border-borderLight text-xs font-mono text-graphite">
                  {selectedTask.evidence_text ? (
                    <span>&ldquo;{selectedTask.evidence_text}&rdquo;</span>
                  ) : (
                    <span className="text-neutral-400 italic">No localized evidence bounding box captured.</span>
                  )}
                </div>
                <div className="text-[11px] text-mutedText mt-1">
                  Document: {selectedTask.document_filename} (Page {selectedTask.page_number})
                </div>
              </div>

              {/* Current Machine Value */}
              <div>
                <label className="text-xs font-medium text-mutedText block mb-1">Machine Extracted Value</label>
                <div className="text-sm font-semibold text-graphite p-2.5 rounded bg-surfaceSecondary border border-borderLight font-mono">
                  {selectedTask.extracted_value || '[Null / Missing]'}
                </div>
              </div>

              {/* Correction Form */}
              <form onSubmit={handleCorrect} className="space-y-4 pt-2 border-t border-borderLight">
                <div>
                  <label className="text-xs font-medium text-graphite block mb-1">
                    Corrected Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={correctionValue}
                    onChange={(e) => setCorrectionValue(e.target.value)}
                    required
                    placeholder="Enter verified correct value..."
                    className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none focus:ring-1 focus:ring-charcoal"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-mutedText block mb-1">Auditor Rationale / Notes</label>
                  <input
                    type="text"
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    placeholder="e.g. Corrected date from handwritten section"
                    className="w-full p-2 rounded-md border border-borderLight text-xs text-graphite focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={submitting || !selectedTask.extracted_value}
                    className="px-4 py-2 rounded-md border border-borderLight bg-surface hover:bg-surfaceSecondary text-xs font-medium text-graphite flex items-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Confirm Machine Value</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !correctionValue}
                    className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Human Correction</span>
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

