import React, { useState, useEffect, useContext } from 'react';
import { Vote, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { governanceAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * GovernanceDAO - DAO proposals and voting (live API + same layout)
 */
const GovernanceDAO = () => {
  const { address, connectWallet } = useContext(ICOContent) || {};
  const [tab, setTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', proposalType: 'general', targetAmount: '', targetAddress: '', duration: '259200' });
  const [createLoading, setCreateLoading] = useState(false);
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    if (tab === 'proposals') {
      setLoading(true);
      governanceAPI.getProposals('active', 'newest').then((data) => setProposals(Array.isArray(data) ? data : [])).catch(() => setProposals([])).finally(() => setLoading(false));
    }
  }, [tab]);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { title, description, proposalType, targetAmount, targetAddress, duration } = createForm;
    if (!title?.trim() || !description?.trim()) {
      toast.error('Title and description required');
      return;
    }
    setCreateLoading(true);
    try {
      await governanceAPI.createProposal(address, { title: title.trim(), description: description.trim(), proposalType: proposalType || 'general', targetAmount: targetAmount ? parseFloat(targetAmount) : undefined, targetAddress: targetAddress?.trim() || undefined, duration: duration ? parseInt(duration, 10) : 259200 });
      toast.success('Proposal created');
      setCreateForm({ title: '', description: '', proposalType: 'general', targetAmount: '', targetAddress: '', duration: '259200' });
      setTab('proposals');
      const data = await governanceAPI.getProposals('active', 'newest');
      setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleVote = async (proposalId, support) => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    setVotingId(proposalId);
    try {
      await governanceAPI.castVote(address, proposalId, support);
      toast.success('Vote cast');
      const data = await governanceAPI.getProposals('active', 'newest');
      setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Vote failed');
    } finally {
      setVotingId(null);
    }
  };

  const formatProposal = (p) => {
    const stats = p.stats || {};
    const totalVotes = (p.forVotes || 0) + (p.againstVotes || 0) + (p.abstainVotes || 0);
    const forPct = totalVotes > 0 ? Math.round((p.forVotes / totalVotes) * 100) : 0;
    const againstPct = totalVotes > 0 ? Math.round((p.againstVotes / totalVotes) * 100) : 0;
    return { ...p, forPct, againstPct, totalVotes, state: p.state || 'PENDING' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
          <p className="text-gray-400">Vote on proposals and shape the marketplace future</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['proposals', 'create'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}>
              {t === 'proposals' ? 'Proposals' : 'Create Proposal'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'proposals' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Active Proposals</p>
                <p className="text-3xl font-bold">{proposals.length}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Your Votes</p>
                <p className="text-3xl font-bold">—</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Rewards</p>
                <p className="text-3xl font-bold text-green-400">—</p>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading proposals…</p>
            ) : (
              <div className="space-y-4">
                {proposals.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">No active proposals. Create one to get started.</div>
                ) : (
                  proposals.map((prop) => {
                    const p = formatProposal(prop);
                    const isActive = p.state === 'PENDING' || p.state === 'ACTIVE';
                    return (
                      <div key={p.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                            <p className="text-sm text-gray-400">{p.totalVotes} votes • {p.state}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-sm font-semibold ${isActive ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}`}>{p.state}</span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{p.description}</p>
                        <div className="flex gap-8 mb-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">For</span>
                              <span className="text-sm font-semibold">{p.forPct}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${p.forPct}%` }}></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Against</span>
                              <span className="text-sm font-semibold">{p.againstPct}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${p.againstPct}%` }}></div>
                            </div>
                          </div>
                        </div>
                        {isActive && address && (
                          <div className="flex gap-3">
                            <button onClick={() => handleVote(p.id, 1)} disabled={votingId === p.id} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-semibold transition disabled:opacity-50">Vote For</button>
                            <button onClick={() => handleVote(p.id, 0)} disabled={votingId === p.id} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-semibold transition disabled:opacity-50">Vote Against</button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                <p className="text-gray-400 mb-4">Connect your wallet to create a proposal.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">Connect Wallet</button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">Create Proposal</h2>
                <form onSubmit={handleCreateProposal} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Title *</label>
                    <input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} placeholder="Proposal title..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Description *</label>
                    <textarea rows="6" value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detailed proposal description..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Type</label>
                    <select value={createForm.proposalType} onChange={(e) => setCreateForm((f) => ({ ...f, proposalType: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                      <option value="general">General</option>
                      <option value="treasury">Treasury</option>
                      <option value="parameter">Parameter</option>
                    </select>
                  </div>
                  <button type="submit" disabled={createLoading} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50">{createLoading ? 'Creating…' : 'Create Proposal'}</button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default GovernanceDAO;
