'use client';

import { useState } from 'react';
import GovernanceProposal from '@/components/GovernanceProposal';

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

// Placeholder data — replace with Stellar SDK contract invocation:
// contract.invoke('get_proposals') from contracts/governance/
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: 'Increase instructor royalty share to 15%',
    description: 'This proposal raises the default royalty basis from 10% to 15% for all new course NFTs, rewarding instructors more fairly for secondary market activity.',
    votes_for: '450000', votes_against: '120000', total_votes: '570000',
    quorum_required: '500000', voting_end_ledger: 9999999, executed: false,
  },
  {
    id: 2,
    title: 'Add Spanish localisation to platform',
    description: 'Fund a community translation sprint to add Spanish (es) as a supported locale, unlocking the Latin American student market.',
    votes_for: '280000', votes_against: '90000', total_votes: '370000',
    quorum_required: '500000', voting_end_ledger: 9999999, executed: false,
  },
  {
    id: 3,
    title: 'Reduce scholarship minimum application amount',
    description: 'Lower the minimum scholarship application from 100 BST to 10 BST to enable micro-scholarships for short courses.',
    votes_for: '620000', votes_against: '85000', total_votes: '705000',
    quorum_required: '500000', voting_end_ledger: 1000, executed: true,
  },
];

export default function GovernancePage() {
  const [walletConnected] = useState(false);
  const [voted, setVoted]  = useState<Set<number>>(new Set());
  const currentLedger      = 1234567;

  const handleVote = async (proposalId: number, _support: boolean) => {
    // Wire-up: invoke contracts/governance/ via Stellar SDK
    // await stellarContract.call('vote', { proposal_id: proposalId, support })
    setVoted((prev) => new Set(prev).add(proposalId));
  };

  const active   = MOCK_PROPOSALS.filter((p) => !p.executed);
  const executed = MOCK_PROPOSALS.filter((p) => p.executed);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Governance</h1>
        <p className="text-sm text-white/50 mt-1">Vote on proposals using your BST token balance. Each token = one vote.</p>
      </div>

      {!walletConnected && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-400">
          Connect your Stellar wallet to participate in governance voting.
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
            Active Proposals ({active.length})
          </h2>
          <div className="space-y-4">
            {active.map((p) => (
              <GovernanceProposal
                key={p.id}
                proposal={p}
                hasVoted={voted.has(p.id)}
                currentLedger={currentLedger}
                walletConnected={walletConnected}
                onVote={handleVote}
              />
            ))}
          </div>
        </section>
      )}

      {executed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
            Executed Proposals ({executed.length})
          </h2>
          <div className="space-y-4">
            {executed.map((p) => (
              <GovernanceProposal
                key={p.id}
                proposal={p}
                hasVoted={false}
                currentLedger={currentLedger}
                walletConnected={walletConnected}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
