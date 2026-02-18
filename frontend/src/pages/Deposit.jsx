import React, { useState, useContext, useEffect } from 'react';
import { ICOContent } from '../Context';
import { userAPI } from '../services/api';
import { getSocket } from '../services/socket';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { useGameWallet } from '../hooks/useGameWallet';
import { Wallet, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Deposit = () => {
  const { address } = useContext(ICOContent);
  const { gameBalance, setGameBalance } = useGameWallet();
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [lastDeposit, setLastDeposit] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const depositAddress = import.meta.env.VITE_PAYMENT_DEPOSIT_ADDRESS || '0xYourPlatformDepositAddress';
  const chipsPerUsdt = import.meta.env.VITE_CHIPS_PER_USDT || 100;

  // Subscribe to deposit events via socket
  useEffect(() => {
    if (!address) return;
    const socket = getSocket();
    const handler = async (payload) => {
      if (!payload) return;
      const wallets = [payload.wallet, payload.buyer, payload.seller, payload.to, payload.from]
        .filter(Boolean)
        .map((w) => String(w).toLowerCase());
      if (wallets.includes(address.toLowerCase())) {
        try {
          const server = await userAPI.getGameBalance(address);
          setGameBalance(server || 0);
          toast.success('Chips balance updated from server!');
        } catch (_) {}
      }
    };
    socket.on('user_activity_update', handler);
    return () => socket.off('user_activity_update', handler);
  }, [address, setGameBalance]);

  const handleVerifyDeposit = async () => {
    const hash = (txHash || '').trim();
    if (!hash) {
      toast.error('Enter a transaction hash');
      return;
    }
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    
    setVerifying(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/payments/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          transactionHash: hash,
          network: 'base', // adjust if needed
        }),
      });
      
      const data = await response.json();
      
      if (response.status === 202) {
        // Pending — will be processed
        setLastDeposit({ status: 'pending', hash, message: data.message });
        toast.info('Deposit recorded as pending. Check back in a moment.');
        setTxHash('');
      } else if (response.ok) {
        // Verified
        setLastDeposit({ status: 'verified', hash, chipsAwarded: data.chipsAwarded });
        toast.success(`✅ Deposit verified! ${data.chipsAwarded} chips awarded.`);
        // Refresh balance
        const server = await userAPI.getGameBalance(address);
        setGameBalance(server || 0);
        setTxHash('');
      } else {
        toast.error(data.error || 'Deposit verification failed');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      toast.error(err.message || 'Failed to verify deposit');
    } finally {
      setVerifying(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    setRefreshing(true);
    try {
      const server = await userAPI.getGameBalance(address);
      setGameBalance(server || 0);
      toast.success('Balance refreshed');
    } catch (err) {
      toast.error('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success('Deposit address copied!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Deposit Chips</h1>
          <p className="text-gray-400 text-lg">Fund your casino chips with USDT on Base network</p>
        </div>

        {!address && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-200">Connect your wallet to deposit chips</p>
          </div>
        )}

        {/* Deposit Instructions */}
        <div className="bg-gray-900/70 backdrop-blur rounded-2xl border border-purple-500/30 p-8 mb-8 shadow-xl shadow-purple-500/5">
          <h2 className="text-2xl font-bold text-white mb-6">How to Deposit</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex gap-4">
              <div className="text-2xl font-bold text-purple-400 flex-shrink-0">1</div>
              <div>
                <p className="font-semibold text-white">Send USDT to this address:</p>
                <div className="mt-2 bg-black/50 rounded-lg p-4 flex items-center justify-between gap-3 font-mono text-sm">
                  <span className="word-break">{depositAddress}</span>
                  <button
                    onClick={copyToClipboard}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white flex items-center gap-1"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl font-bold text-purple-400 flex-shrink-0">2</div>
              <div>
                <p className="font-semibold text-white">Network: Base (Mainnet or Testnet)</p>
                <p className="text-sm text-gray-400">Make sure you're on the correct network</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl font-bold text-purple-400 flex-shrink-0">3</div>
              <div>
                <p className="font-semibold text-white">Conversion Rate: {chipsPerUsdt} chips per USDT</p>
                <p className="text-sm text-gray-400">Example: 10 USDT = {10 * chipsPerUsdt} chips</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl font-bold text-purple-400 flex-shrink-0">4</div>
              <div>
                <p className="font-semibold text-white">Paste your transaction hash below and verify</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verify Deposit Form */}
        <div className="bg-gray-900/70 backdrop-blur rounded-2xl border border-blue-500/30 p-8 mb-8 shadow-xl shadow-blue-500/5">
          <h2 className="text-2xl font-bold text-white mb-6">Verify Your Deposit</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-2">Transaction Hash (0x...)</label>
              <input
                type="text"
                placeholder="Paste your transaction hash from the blockchain explorer"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full bg-black/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
              />
            </div>
            <button
              onClick={handleVerifyDeposit}
              disabled={verifying || !address || !txHash.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader size={18} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Verify Deposit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Balance & Actions */}
        <div className="bg-gray-900/70 backdrop-blur rounded-2xl border border-green-500/30 p-8 mb-8 shadow-xl shadow-green-500/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="text-green-400" /> Your Chips Balance
          </h2>
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-1">Current Balance</p>
            <p className="text-5xl font-bold text-green-400">{gameBalance.toFixed(0)} chips</p>
          </div>
          <button
            onClick={handleRefreshBalance}
            disabled={refreshing || !address}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Balance'}
          </button>
        </div>

        {/* Last Deposit Status */}
        {lastDeposit && (
          <div
            className={`rounded-2xl border p-6 mb-8 ${
              lastDeposit.status === 'verified'
                ? 'bg-green-900/20 border-green-500/50'
                : 'bg-yellow-900/20 border-yellow-500/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastDeposit.status === 'verified' ? (
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" />
              )}
              <div>
                <h3 className={`font-semibold mb-1 ${lastDeposit.status === 'verified' ? 'text-green-200' : 'text-yellow-200'}`}>
                  {lastDeposit.status === 'verified' ? 'Deposit Verified ✅' : 'Deposit Pending ⏳'}
                </h3>
                {lastDeposit.status === 'verified' ? (
                  <p className="text-sm text-green-200">{lastDeposit.chipsAwarded} chips awarded to your account</p>
                ) : (
                  <p className="text-sm text-yellow-200">{lastDeposit.message || 'Your deposit is being processed. Please check back soon.'}</p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-mono break-all">{lastDeposit.hash}</p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ / Help */}
        <div className="bg-gray-900/40 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">FAQ</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-white mb-1">How long does verification take?</p>
              <p>Deposits are verified automatically once the transaction is confirmed on-chain (usually within 1-2 minutes).</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Where do I find my transaction hash?</p>
              <p>After sending USDT, find your transaction in a blockchain explorer (e.g., Basescan for Base network). The hash is a long string starting with "0x".</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Can I use other chains?</p>
              <p>Currently only Base network is supported. More chains coming soon.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Are there fees?</p>
              <p>You only pay the network gas fee. All USDT amount is converted to chips at {chipsPerUsdt} chips per USDT.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Deposit;
