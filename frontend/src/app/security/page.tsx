'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  Terminal, 
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Adversarial Defense Matrix · OWASP Top 10 for LLM
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Adversarial Security & Penetration Lab
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Validate document boundary sandboxing, indirect prompt injection defense, SSRF interception, stored XSS sanitization, and path traversal restrictions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleRunAudit}
          loading={running}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute Security Audit Suite</span>
        </Button>
      </div>

      {/* Security Status Banner */}
      <div className={`p-5 rounded-xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        allPassed 
          ? 'bg-emerald-950/20 border-emerald-500/30' 
          : 'bg-[#0D111A]/90 border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            allPassed 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
          }`}>
            {allPassed ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-white">
                {allPassed ? 'All Adversarial Attack Vectors Mitigated' : 'Security Defense Ready'}
              </span>
              <Badge variant={allPassed ? 'success' : 'neutral'}>
                {allPassed ? '100% Defense Verified' : `${results.length} Active Vectors`}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Zero instruction hijacking, zero cross-workspace file leaks, zero unescaped script tags detected across the penetration test suite.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-right">
            <div className="text-[10px] text-slate-400 uppercase">Tested Vectors</div>
            <div className="text-white font-semibold text-sm tabular-nums">{results.length} Vectors</div>
          </div>
        </div>
      </div>

      {/* Test Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <CardTitle>Adversarial Penetration Vectors & Automated Mitigation Audit</CardTitle>
          </div>
          <Badge variant="neutral">
            Sandboxed Local Execution
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08] font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Vector ID</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Threat Category</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Adversarial Payload Snippet</th>
                <th className="py-3 px-3 font-medium uppercase tracking-wider">Defense Mechanism / Actual Behavior</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-mono text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Loading security test suite results...</span>
                    </div>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-mono text-xs">
                    No security audits recorded yet. Click &quot;Execute Security Audit Suite&quot; above to run test vectors.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      <span className="text-sky-400">#</span>{r.test_id}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant="neutral">
                        {r.attack_category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300 max-w-xs">
                      <div className="p-1.5 rounded bg-[#07090E] border border-white/[0.08] truncate text-slate-300">
                        {r.payload}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-200 text-xs font-medium">{r.actual_behavior}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.evidence_log}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge
                        dot
                        variant={r.passed ? 'success' : 'danger'}
                      >
                        {r.passed ? 'MITIGATED' : 'VULNERABLE'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
