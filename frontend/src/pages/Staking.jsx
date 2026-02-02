import React, { useState, useEffect, useContext } from 'react';
import { TrendingUp, Lock, Gift } from 'lucide-react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { stakingAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Staking - NFT staking with rewards (live API + same layout)
 */
const Staking = () => {
  const { address, connectWallet, selectedChain, hasStakingContract, stakeTokensOnChain, unstakeTokensOnChain, claimRewardsOnChain } = useContext(ICOContent) || {};
  const network = (selectedChain || 'polygon').toLowerCase();
  const useOnChain = hasStakingContract?.(network);
  const [tab, setTab] = useState('stake');
  const [stakes, setStakes] = useState([]);
  const [rewards, setRewards] = useState({ pending: '0', claimed: '0' });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nftContract: '', tokenId: '', lockDays: '30' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [unstakingId, setUnstakingId] = useState(null);

  useEffect(() => {
    if (!address) return;
    if (tab === 'my') {
      setLoading(true);
      stakingAPI.getMyStakes(address).then((data) => setStakes(Array.isArray(data) ? data : [])).catch(() => setStakes([])).finally(() => setLoading(false));
    } else if (tab === 'rewards') {
      setLoading(true);
      stakingAPI.getRewards(address).then((data) => setRewards(data || { pending: '0', claimed: '0' })).catch(() => setRewards({ pending: '0', claimed: '0' })).finally(() => setLoading(false));
    }
  }, [address, tab]);

  const handleStake = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { nftContract, tokenId, lockDays } = form;
    if (!tokenId?.trim()) {
      toast.error('Enter token ID');
      return;
    }
    if (!useOnChain && !nftContract?.trim()) {
      toast.error('Enter NFT contract and token ID');
      return;
    }
    setSubmitLoading(true);
    try {
      if (useOnChain && stakeTokensOnChain) {
        await stakeTokensOnChain(network, [tokenId.trim()]);
        toast.success('Staked on-chain');
      } else {
        await stakingAPI.stake(address, { nftContract: (nftContract || '').trim(), tokenId: tokenId.trim(), lockDays: parseInt(lockDays, 10) || 30 });
        toast.success('Stake recorded');
      }
      setForm({ nftContract: '', tokenId: '', lockDays: '30' });
      setTab('my');
      const data = await stakingAPI.getMyStakes(address);
      setStakes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Stake failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUnstake = async (stake) => {
    if (!address) return;
    setUnstakingId(stake.id);
    try {
      if (useOnChain && unstakeTokensOnChain) {
        const tokenId = stake.tokenId ?? stake.id?.split?.('-')?.[1];
        if (tokenId != null) await unstakeTokensOnChain(network, [String(tokenId)]);
        toast.success('Unstaked on-chain');
      } else {
        await stakingAPI.unstake(address, { nftContract: stake.nftContract, tokenId: stake.tokenId });
        toast.success('Unstaked');
      }
      const data = await stakingAPI.getMyStakes(address);
      setStakes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Unstake failed');
    } finally {
      setUnstakingId(null);
    }
  };

  const handleClaimRewards = async () => {
    if (!address) return;
    try {
      if (useOnChain && claimRewardsOnChain) {
        await claimRewardsOnChain(network);
        toast.success('Rewards claimed on-chain');
      } else {
        await stakingAPI.claimRewards(address);
        toast.success('Rewards claimed');
      }
      const data = await stakingAPI.getRewards(address);
      setRewards(data || { pending: '0', claimed: '0' });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Claim failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Staking & Rewards</h1>
          <p className="text-gray-400">Stake NFTs to earn passive rewards</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['stake', 'my', 'rewards'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}>
              {t === 'stake' ? 'Stake NFTs' : t === 'my' ? 'My Stakes' : 'Rewards'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'stake' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                <p className="text-gray-400 mb-4">Connect your wallet to stake NFTs.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">Connect Wallet</button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">Stake Your NFTs</h2>
                <form onSubmit={handleStake} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                    <input value={form.nftContract} onChange={(e) => setForm((f) => ({ ...f, nftContract: e.target.value }))} placeholder="0x..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Token ID *</label>
                    <input value={form.tokenId} onChange={(e) => setForm((f) => ({ ...f, tokenId: e.target.value }))} placeholder="1" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lock Days</label>
                    <input type="number" min="1" value={form.lockDays} onChange={(e) => setForm((f) => ({ ...f, lockDays: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                  <div className="bg-blue-900/30 border border-blue-700 rounded p-4">
                    <p className="text-sm text-blue-300"><TrendingUp size={16} className="inline mr-2" />Estimated APY: 15-25% depending on NFT rarity</p>
                  </div>
                  <button type="submit" disabled={submitLoading} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50">
                    <Lock size={18} className="inline mr-2" />{submitLoading ? 'Staking…' : 'Stake NFT'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'my' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {!address ? null : loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Staked</p>
                    <p className="text-3xl font-bold">{stakes.length}</p>
                    <p className="text-xs text-gray-400 mt-1">NFTs</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Earned (claimed)</p>
                    <p className="text-3xl font-bold text-green-400">—</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Average APY</p>
                    <p className="text-3xl font-bold text-yellow-400">~18%</p>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700 bg-gray-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left">NFT</th>
                        <th className="px-6 py-3 text-left">Staked</th>
                        <th className="px-6 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stakes.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No stakes yet. Stake an NFT above.</td></tr>
                      ) : (
                        stakes.map((s) => (
                          <tr key={s.id} className="border-b border-gray-700">
                            <td className="px-6 py-3">{s.nftContract ? `${s.nftContract.slice(0, 8)}... #${s.tokenId}` : `#${s.tokenId}`}</td>
                            <td className="px-6 py-3">{s.stakedAt ? new Date(s.stakedAt).toLocaleDateString() : '—'}</td>
                            <td className="px-6 py-3">
                              <button onClick={() => handleUnstake(s)} disabled={unstakingId === s.id} className="text-purple-400 hover:text-purple-300 disabled:opacity-50">{unstakingId === s.id ? 'Unstaking…' : 'Unstake'}</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {tab === 'rewards' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {!address ? null : loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center max-w-md mx-auto">
                <Gift size={48} className="mx-auto mb-4 text-yellow-400" />
                <h2 className="text-3xl font-bold mb-2">{rewards.pending ?? '0'} ETH</h2>
                <p className="text-gray-400 mb-2">Pending Rewards</p>
                <p className="text-sm text-gray-500 mb-6">Claimed: {rewards.claimed ?? '0'} ETH</p>
                <button onClick={handleClaimRewards} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold">Claim Rewards</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Staking;
