'use client';

import { useState } from 'react';

interface Application {
  id: number;
  student: string;
  amount_requested: string;
  status: number;  // 0=pending, 1=approved, 2=rejected, 3=distributed
  applied_at: number;
}

interface ScholarshipManagerProps {
  fundBalance?: string;
  applications?: Application[];
  isAdmin?: boolean;
  walletAddress?: string;
  onDonate?: (amount: string) => Promise<void>;
  onApply?: (amountRequested: string) => Promise<void>;
  onApprove?: (appId: number) => Promise<void>;
  onReject?: (appId: number) => Promise<void>;
  onDistribute?: (appId: number) => Promise<void>;
}

const STATUS_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  1: { label: 'Approved',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  2: { label: 'Rejected',    color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
  3: { label: 'Distributed', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
};

export default function ScholarshipManager({
  fundBalance = '0',
  applications = [],
  isAdmin = false,
  walletAddress,
  onDonate,
  onApply,
  onApprove,
  onReject,
  onDistribute,
}: ScholarshipManagerProps) {
  const [donateAmount, setDonateAmount]   = useState('');
  const [applyAmount, setApplyAmount]     = useState('');
  const [loading, setLoading]             = useState<string | null>(null);
  const [message, setMessage]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const wrap = async (key: string, fn: () => Promise<void>) => {
    setLoading(key); setMessage(null);
    try   { await fn(); setMessage({ type: 'ok', text: 'Transaction submitted' }); }
    catch (e) { setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Error' }); }
    finally { setLoading(null); }
  };

  return (
    <div className="space-y-5">
      {/* Fund balance */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-900/30 to-indigo-900/30 p-5">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Scholarship Pool Balance</p>
        <p className="text-3xl font-bold text-sky-400 tabular-nums">{fundBalance} <span className="text-base text-white/40">BST</span></p>
      </div>

      {/* Donate */}
      {walletAddress && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Donate to Pool</h3>
          <div className="flex gap-2">
            <input type="number" min="0" placeholder="Amount (BST)" value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
              className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm px-3 py-2 focus:outline-none focus:border-sky-400" />
            <button onClick={() => wrap('donate', () => onDonate?.(donateAmount) ?? Promise.resolve())}
              disabled={!donateAmount || loading === 'donate'}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-all">
              {loading === 'donate' ? '…' : 'Donate'}
            </button>
          </div>
        </div>
      )}

      {/* Apply */}
      {walletAddress && !isAdmin && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Apply for Scholarship</h3>
          <div className="flex gap-2">
            <input type="number" min="0" placeholder="Amount requested (BST)" value={applyAmount}
              onChange={(e) => setApplyAmount(e.target.value)}
              className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm px-3 py-2 focus:outline-none focus:border-emerald-400" />
            <button onClick={() => wrap('apply', () => onApply?.(applyAmount) ?? Promise.resolve())}
              disabled={!applyAmount || loading === 'apply'}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all">
              {loading === 'apply' ? '…' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Applications list */}
      {applications.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Applications ({applications.length})</h3>
          <div className="space-y-2">
            {applications.map((app) => {
              const s = STATUS_LABEL[app.status] ?? STATUS_LABEL[0];
              return (
                <div key={app.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/60 font-mono">{app.student.slice(0, 6)}…{app.student.slice(-4)}</p>
                    <p className="text-sm font-semibold text-white tabular-nums">{app.amount_requested} BST</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                    {isAdmin && app.status === 0 && (
                      <>
                        <button onClick={() => wrap(`approve-${app.id}`, () => onApprove?.(app.id) ?? Promise.resolve())}
                          disabled={!!loading}
                          className="text-xs px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
                          ✓
                        </button>
                        <button onClick={() => wrap(`reject-${app.id}`, () => onReject?.(app.id) ?? Promise.resolve())}
                          disabled={!!loading}
                          className="text-xs px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50">
                          ✕
                        </button>
                      </>
                    )}
                    {isAdmin && app.status === 1 && (
                      <button onClick={() => wrap(`dist-${app.id}`, () => onDistribute?.(app.id) ?? Promise.resolve())}
                        disabled={!!loading}
                        className="text-xs px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50">
                        Disburse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs rounded-xl border px-3 py-2 ${message.type === 'ok' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-rose-400 bg-rose-400/10 border-rose-400/30'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
