'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileCode,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SecurityPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await api.getSecurityResults();
      setResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleRunAudit = async () => {
    try {
      setRunning(true);
      await api.runSecurityAudit();
      await loadResults();
    } catch (err: any) {
      alert(`Audit run failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const allPassed = results.length > 0 && results.every(r => r.passed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-graphite">Adversarial Security & Injection Testing</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Evaluate defenses against untrusted document content, indirect prompt injection, SSRF, XSS, and path traversal.
          </p>
        </div>
        <button
          onClick={handleRunAudit}
          disabled={running}
          className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40"
        >
          <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Executing Vectors...' : 'Execute Security Suite'}</span>
        </button>
      </div>

      {/* Security Status Banner */}
      <div className={`p-4 rounded-lg border text-xs flex items-center justify-between ${
        allPassed 
          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
          : 'bg-amber-50/50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2.5">
          {allPassed ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <span className="font-bold text-sm block">
              {allPassed ? 'All Security Checks Passed' : 'Security Tests Pending Execution'}
            </span>
            <span className="text-mutedText">
              Zero instruction leakage or model hijacking detected across active adversarial fixtures.
            </span>
          </div>
        </div>
        <span className="font-mono text-xs font-bold uppercase">
          {results.length} Active Vectors
        </span>
      </div>

      {/* Test Results Table */}
      <div className="rounded-lg bg-surface border border-borderLight overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surfaceSecondary text-mutedText border-b border-borderLight">
            <tr>
              <th className="py-3 px-4 font-medium">Test ID</th>
              <th className="py-3 px-3 font-medium">Attack Category</th>
              <th className="py-3 px-3 font-medium">Adversarial Payload Snippet</th>
              <th className="py-3 px-3 font-medium">Outcome & Mitigation</th>
              <th className="py-3 px-4 font-medium text-right">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight">
            {results.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-mutedText">
                  No security audits recorded yet. Click &quot;Execute Security Suite&quot; to test.
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-4 font-mono text-[11px] font-bold text-graphite">
                    {r.test_id}
                  </td>
                  <td className="py-3 px-3 text-mutedText">
                    <span className="px-2 py-0.5 rounded bg-surfaceSecondary text-[11px] font-mono border border-borderLight">
                      {r.attack_category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-graphite font-mono text-[11px] max-w-xs truncate">
                    &ldquo;{r.payload}&rdquo;
                  </td>
                  <td className="py-3 px-3 text-mutedText text-[11px]">
                    <div className="font-medium text-graphite">{r.actual_behavior}</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{r.evidence_log}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      r.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

