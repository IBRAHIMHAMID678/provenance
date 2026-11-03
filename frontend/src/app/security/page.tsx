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
  Lock,
  Terminal,
  Shield,
  Bug,
  Cpu
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Adversarial Defense Matrix · OWASP Top 10 for LLM
            </span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Adversarial Security & Penetration Lab
          </h1>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Validate document boundary sandboxing, indirect prompt injection defense, SSRF interception, stored XSS sanitization, and path traversal restrictions.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={running}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-[0.98] disabled:opacity-40"
        >
          <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Executing Vectors...' : 'Execute Security Audit Suite'}</span>
        </button>
      </div>

      {/* Security Status Banner */}
      <div className={`p-5 rounded-xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-xl ${
        allPassed 
          ? 'glass-card border-emerald-500/30 bg-emerald-950/20' 
          : 'glass-card border-amber-500/30 bg-amber-950/20'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            allPassed 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
          }`}>
            {allPassed ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">
                {allPassed ? 'All Adversarial Attack Vectors Mitigated' : 'Security Suite Ready for Evaluation'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                allPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {allPassed ? '100% Defense' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1 max-w-2xl">
              Zero instruction hijacking, zero cross-workspace file leaks, zero unescaped script tags detected across the penetration test suite.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-right">
            <div className="text-[10px] text-white/40 uppercase">Tested Vectors</div>
            <div className="text-white font-bold text-sm">{results.length} Active Vectors</div>
          </div>
        </div>
      </div>

      {/* Cybernetic Test Results Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 font-semibold text-xs text-white bg-[#0D1117] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Adversarial Penetration Vectors & Automated Mitigation Audit</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
            Environment: Local Sandboxed Execution
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#090C10] text-white/50 border-b border-white/10 font-mono text-[11px]">
            <tr>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Vector ID</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Threat Category</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Adversarial Payload Snippet</th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider">Defense Mechanism / Actual Behavior</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-white/40 font-mono text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Loading security test suite results...</span>
                  </div>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-white/40 font-mono text-xs">
                  No security audits recorded yet. Click &quot;Execute Security Audit Suite&quot; above to run test vectors.
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="hover:bg-cyan-500/[0.03] transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    <span className="text-cyan-400">#</span>{r.test_id}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
                      {r.attack_category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-white/80 max-w-xs">
                    <div className="p-1.5 rounded bg-[#07080B] border border-white/10 truncate text-white/70">
                      {r.payload}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-white text-xs font-medium">{r.actual_behavior}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">{r.evidence_log}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                      r.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {r.passed ? 'MITIGATED' : 'VULNERABLE'}
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
