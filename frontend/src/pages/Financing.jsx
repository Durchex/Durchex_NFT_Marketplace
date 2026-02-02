import React, { useState, useEffect, useContext } from 'react';
import { Lock, DollarSign, Clock, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { financingAPI } from '../services/api';
import toast from 'react-hot-toast';

const FALLBACK_LOANS = [
  { id: 1, nft: 'Cyber Punk #123', amount: 2.5, collateral: 5.0, interest: '8% APY', expires: '45 days' },
];

/**
 * Financing - Collateral loans and flexible repayment (live API + same layout)
 */
const DEFAULT_FINANCING_NETWORK = 'polygon';

const Financing = () => {
  const { address, connectWallet, createLoanOnChain, repayLoanOnChain, hasFinancingContract, selectedChain } = useContext(ICOContent) || {};
  const network = selectedChain?.toLowerCase() || DEFAULT_FINANCING_NETWORK;
  const [tab, setTab] = useState('loans');
  const [activeLoans, setActiveLoans] = useState(FALLBACK_LOANS);
  const [loading, setLoading] = useState(false);
  const [repayingId, setRepayingId] = useState(null);
  const [loanForm, setLoanForm] = useState({ nftContract: '', nftTokenId: '', loanAmount: '', loanDuration: '30' });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (tab === 'loans' && address) {
      setLoading(true);
      financingAPI.getUserLoans(address)
        .then((loans) => setActiveLoans(Array.isArray(loans) && loans.length > 0 ? loans : FALLBACK_LOANS))
        .catch(() => setActiveLoans(FALLBACK_LOANS))
        .finally(() => setLoading(false));
    }
  }, [tab, address]);

  const handleRepay = async (loanId) => {
    if (!address) return;
    setRepayingId(loanId);
    try {
      if (hasFinancingContract?.(network)) {
        await repayLoanOnChain(network, loanId);
      }
      await financingAPI.repayLoan(address, loanId);
      toast.success('Loan repaid');
      const loans = await financingAPI.getUserLoans(address);
      setActiveLoans(Array.isArray(loans) && loans.length > 0 ? loans : FALLBACK_LOANS);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Repay failed');
    } finally {
      setRepayingId(null);
    }
  };

  const handleRequestLoan = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { nftContract, nftTokenId, loanAmount, loanDuration } = loanForm;
    if (!nftContract?.trim() || !nftTokenId?.trim() || !loanAmount?.trim() || !loanDuration?.trim()) {
      toast.error('Fill all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      if (hasFinancingContract?.(network)) {
        await createLoanOnChain(network, nftContract.trim(), nftTokenId.trim(), parseFloat(loanAmount), parseInt(loanDuration, 10));
      }
      await financingAPI.createLoan(address, {
        nftContract: nftContract.trim(),
        nftTokenId: nftTokenId.trim(),
        loanAmount: parseFloat(loanAmount),
        loanDuration: parseInt(loanDuration, 10),
      });
      toast.success('Loan request submitted');
      setLoanForm({ nftContract: '', nftTokenId: '', loanAmount: '', loanDuration: '30' });
      setTab('loans');
      const loans = await financingAPI.getUserLoans(address);
      setActiveLoans(Array.isArray(loans) && loans.length > 0 ? loans : FALLBACK_LOANS);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Request failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const displayLoans = activeLoans.map((loan) => ({
    id: loan.id ?? loan.loanId ?? loan._id,
    nft: loan.nft ?? `NFT #${loan.nftTokenId ?? loan.tokenId ?? ''}`,
    amount: loan.amount ?? loan.loanAmount ?? loan.currentDebt ?? 0,
    collateral: loan.collateral ?? loan.collateralValue ?? 0,
    interest: loan.interest ?? loan.interestRate ?? '—',
    expires: loan.expires ?? (loan.daysRemaining != null ? `${loan.daysRemaining} days` : '—'),
  }));

  const totalBorrowed = displayLoans.reduce((s, l) => s + Number(l.amount), 0);
  const totalCollateral = displayLoans.reduce((s, l) => s + Number(l.collateral), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Collateral Financing</h1>
          <p className="text-gray-400">Use NFTs as collateral for loans with flexible terms</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['loans', 'new'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t === 'loans' ? 'My Loans' : 'Request Loan'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'loans' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                <p className="mb-4">Connect your wallet to view your loans.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Borrowed</p>
                    <p className="text-3xl font-bold text-green-400">{totalBorrowed.toFixed(2)} ETH</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Collateral Value</p>
                    <p className="text-3xl font-bold">{totalCollateral.toFixed(2)} ETH</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm">Interest Rate</p>
                    <p className="text-3xl font-bold text-yellow-400">8% APY</p>
                  </div>
                </div>

                {loading ? (
                  <p className="text-gray-400">Loading loans…</p>
                ) : (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-700 bg-gray-700/30">
                        <tr>
                          <th className="px-6 py-3 text-left">NFT (Collateral)</th>
                          <th className="px-6 py-3 text-left">Borrowed</th>
                          <th className="px-6 py-3 text-left">Interest</th>
                          <th className="px-6 py-3 text-left">Expires</th>
                          <th className="px-6 py-3 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayLoans.map(loan => (
                          <tr key={loan.id} className="border-b border-gray-700">
                            <td className="px-6 py-3">{loan.nft}</td>
                            <td className="px-6 py-3">{loan.amount} ETH</td>
                            <td className="px-6 py-3">{loan.interest}</td>
                            <td className="px-6 py-3">{loan.expires}</td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => handleRepay(loan.id)}
                                disabled={repayingId === loan.id}
                                className="text-purple-400 hover:text-purple-300 disabled:opacity-50"
                              >
                                {repayingId === loan.id ? 'Repaying…' : 'Repay'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {tab === 'new' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                <p className="mb-4">Connect your wallet to request a loan.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">Request a Loan</h2>
                <form onSubmit={handleRequestLoan} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                    <input
                      value={loanForm.nftContract}
                      onChange={(e) => setLoanForm((f) => ({ ...f, nftContract: e.target.value }))}
                      placeholder="0x..."
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Token ID *</label>
                    <input
                      value={loanForm.nftTokenId}
                      onChange={(e) => setLoanForm((f) => ({ ...f, nftTokenId: e.target.value }))}
                      placeholder="1"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Loan Amount (ETH) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={loanForm.loanAmount}
                      onChange={(e) => setLoanForm((f) => ({ ...f, loanAmount: e.target.value }))}
                      placeholder="1.5"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Loan Duration (days) *</label>
                    <input
                      type="number"
                      min="1"
                      value={loanForm.loanDuration}
                      onChange={(e) => setLoanForm((f) => ({ ...f, loanDuration: e.target.value }))}
                      placeholder="30"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <button type="submit" disabled={createLoading} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50">
                    {createLoading ? 'Submitting…' : 'Request Loan'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Financing;
