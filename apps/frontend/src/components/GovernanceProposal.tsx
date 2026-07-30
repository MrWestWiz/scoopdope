'use client';

import { useState } from 'react';

interface Proposal {
  id: number;
  title: string;
  description: string;
  votes_for: string;
  votes_against: string;
  total_votes: string;
  quorum_required: string;
  voting_end_ledger: number;
  executed: boolean;
}

interface GovernanceProposalProps {
  proposal: Proposal;
  hasVoted?: boolean;
  currentLedger?: number;
  walletConnected?: boolean;
  onVote?: (proposalId: number, support: boolean) => Promise<void>;
}

export default function GovernanceProposal({
  proposal,
  hasVoted = false,
  currentLedger = 0,
  walletConnected = false,
  onVote,
}: GovernanceProposalProps) {
  const [loading, setLoading] = useState<'yes' | 'no' | null>(null);
  const [voted, setVoted]     = useState(hasVoted);
  const [error, setError]     = useState<string | null>(null);

  const votesFor     = Number(proposal.votes_for);
  const votesAgainst = Number(proposal.votes_against);
  const total        = votesFor + votesAgainst || 1;
  const quorum       = Number(proposal.quorum_required);
  const totalVotes   = Number(proposal.total_votes);
  const forPct       = Math.round((votesFor / total) * 100);
  const quorumPct    = Math.min(Math.round((totalVotes / quorum) * 100), 100);
  const isActive     = !proposal.executed && currentLedger < proposal.voting_end_ledger;
  const ledgersLeft  = Math.max(0, proposal.voting_end_ledger - currentLedger);

  const handleVote = async (support: boolean) => {
    if (!onVote) return;
    setLoading(support ? 'yes' : 'no'); setError(null);
    try {
      await onVote(proposal.id, support);
      setVoted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed');
    } finally { setLoading(null); }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/40 font-mono mb-1">Proposal #{proposal.id}</p>
          <h3 className="text-sm font-bold text-white leading-snug">{proposal.title}</h3>
        </div>
        <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
          proposal.executed ? 'text-sky-400 border-sky-400/40 bg-sky-400/10' :
          isActive          ? 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10' :
                              'text-white/40 border-white/20 bg-white/5'
        }`}>
          {proposal.executed ? 'Executed' : isActive ? `Active · ${ledgersLeft} ledgers left` : 'Ended'}
        </span>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">{proposal.description}</p>

      {/* Vote bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/50">
          <span className="text-emerald-400">For {votesFor} ({forPct}%)</span>
          <span className="text-rose-400">Against {votesAgainst} ({100 - forPct}%)</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${forPct}%` }} />
        </div>
      </div>

      {/* Quorum progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/40">
          <span>Quorum progress</span>
          <span>{quorumPct}% of {proposal.quorum_required} required</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${quorumPct >= 100 ? 'bg-sky-400' : 'bg-sky-600'}`}
            style={{ width: `${quorumPct}%` }} />
        </div>
      </div>

      {/* Vote buttons */}
      {isActive && !voted && walletConnected && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => handleVote(true)} disabled={!!loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all">
            {loading === 'yes' ? '…' : '✓ Vote For'}
          </button>
          <button onClick={() => handleVote(false)} disabled={!!loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all">
            {loading === 'no' ? '…' : '✕ Vote Against'}
          </button>
        </div>
      )}

      {voted       && <p className="text-xs text-white/40 text-center py-1">✓ You have voted on this proposal</p>}
      {!walletConnected && isActive && <p className="text-xs text-white/40 text-center py-1">Connect wallet to vote</p>}
      {error && <p role="alert" className="text-xs text-rose-400">⚠ {error}</p>}
    </article>
  );
}
