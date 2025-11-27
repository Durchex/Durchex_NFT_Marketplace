import React, { useState, useEffect } from 'react';
import { FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  createTezosContextHook, 
  TaquitoClient,
  getTezosMinWithdrawal,
  isValidTezosAddress 
} from '../services/TezosAdapter';

/**
 * TezosWithdrawUI - Example UI Component for Tezos Withdrawal Flow
 * 
 * Features:
 * - Network selection (mainnet/testnet)
 * - Wallet connection
 * - Withdraw amount input with minimum validation
 * - Balance display and conversion
 * - Transaction status tracking
 * 
 * This component demonstrates how to integrate TezosAdapter with the
 * existing admin dashboard UI pattern.
 */
const TezosWithdrawUI = () => {
  // Initialize Tezos context
  const tezosContext = createTezosContextHook();

  // State management
  const [network, setNetwork] = useState('testnet');
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        await tezosContext.initialize(network);
        const minInfo = tezosContext.getMinWithdrawal();
        setMinWithdrawal(minInfo);
      } catch (error) {
        console.error('Failed to initialize Tezos context:', error);
        toast.error('Failed to initialize Tezos');
      }
    };
    init();
  }, [network]);

  /**
   * Connect wallet - Temple Wallet integration
   */
  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const { account: acc, balance: bal } = await tezosContext.connectWallet('temple');
      setAccount(acc);
      setBalance(bal);
      setIsConnected(true);
      toast.success(`Connected: ${acc.slice(0, 8)}...`);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet. Is Temple Wallet installed?');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate withdraw amount
   * Checks against minimum withdrawal requirement
   */
  const validateWithdrawAmount = (amount) => {
    setValidationError('');

    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Please enter a valid amount');
      return false;
    }

    const amountXTZ = parseFloat(amount);

    if (!minWithdrawal) {
      setValidationError('Minimum withdrawal info not loaded');
      return false;
    }

    if (amountXTZ < minWithdrawal.xtz) {
      setValidationError(
        `Minimum withdrawal: ${minWithdrawal.recommendedMinimum} XTZ (includes ~${minWithdrawal.networkFee} XTZ fee)`
      );
      return false;
    }

    if (!balance) {
      setValidationError('Balance not loaded');
      return false;
    }

    if (amountXTZ > balance) {
      setValidationError(`Insufficient balance. Available: ${balance.toFixed(6)} XTZ`);
      return false;
    }

    return true;
  };

  /**
   * Handle withdraw button click
   * Executes withdrawal transaction
   */
  const handleWithdraw = async () => {
    if (!validateWithdrawAmount(withdrawAmount)) {
      return;
    }

    setIsLoading(true);
    try {
      const amountXTZ = parseFloat(withdrawAmount);
      const operation = await tezosContext.withdraw(amountXTZ);

      toast.success(`Withdrawal initiated! Operation: ${operation.hash}`);
      setWithdrawAmount('');

      // Optional: Refresh balance after transaction
      await new Promise(r => setTimeout(r, 2000));
      const updatedBalance = tezosContext.getBalance();
      setBalance(updatedBalance);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle network switch
   */
  const handleNetworkSwitch = async (newNetwork) => {
    setIsLoading(true);
    try {
      setNetwork(newNetwork);
      await tezosContext.switchNetwork(newNetwork);

      // Reset connection state
      setIsConnected(false);
      setAccount(null);
      setBalance(null);

      toast.success(`Switched to ${newNetwork}`);
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FiDownload className="text-green-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-900">Tezos Withdraw</h2>
        </div>
        <p className="text-sm text-gray-600">
          Withdraw XTZ from your Tezos marketplace contract
        </p>
      </div>

      {/* Network Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Network
        </label>
        <div className="flex gap-2">
          {['testnet', 'mainnet'].map((net) => (
            <button
              key={net}
              onClick={() => handleNetworkSwitch(net)}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                network === net
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {net.charAt(0).toUpperCase() + net.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {network === 'testnet' 
            ? 'Using testnet (ghostnet). Get test XTZ from faucet.' 
            : 'Using mainnet. Real XTZ will be withdrawn.'}
        </p>
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 mb-3">
            Connect your Temple Wallet to proceed with withdrawal.
          </p>
          <button
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect Temple Wallet'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Don't have Temple Wallet? Install it from{' '}
            <a href="https://templewallet.com" className="text-blue-600 underline">
              templewallet.com
            </a>
          </p>
        </div>
      ) : (
        <>
          {/* Connected Account Info */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3 mb-3">
              <FiCheckCircle className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Connected Account</p>
                <p className="text-sm text-green-800 font-mono break-all">{account}</p>
              </div>
            </div>

            {/* Balance Display */}
            <div className="mt-4 p-3 bg-white rounded border border-green-200">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Available Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {balance?.toFixed(6) || '0.000000'} XTZ
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ≈ {(balance * 1000000).toFixed(0)} mutez
              </p>
            </div>
          </div>

          {/* Minimum Withdrawal Info */}
          {minWithdrawal && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Minimum Withdrawal</p>
                  <ul className="text-xs space-y-1">
                    <li>• Minimum amount: {minWithdrawal.xtz} XTZ</li>
                    <li>• Network fee: ~{minWithdrawal.networkFee} XTZ</li>
                    <li>
                      • Recommended minimum to withdraw:{' '}
                      <strong>{minWithdrawal.recommendedMinimum} XTZ</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Withdrawal Amount (XTZ)
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              max={balance}
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                setValidationError('');
              }}
              placeholder={minWithdrawal ? `Min: ${minWithdrawal.recommendedMinimum} XTZ` : '0.00'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
            />

            {/* Quick Amount Buttons */}
            {balance && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setWithdrawAmount((balance * 0.25).toString())}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  25%
                </button>
                <button
                  onClick={() => setWithdrawAmount((balance * 0.5).toString())}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => setWithdrawAmount((balance * 0.75).toString())}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  75%
                </button>
                <button
                  onClick={() => setWithdrawAmount(balance.toString())}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  Max
                </button>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <p className="text-xs text-red-600 mt-2 flex items-start gap-1">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                {validationError}
              </p>
            )}
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={isLoading || !withdrawAmount || validationError}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiDownload />
            {isLoading ? 'Processing Withdrawal...' : 'Withdraw XTZ'}
          </button>

          {/* Disconnect Button */}
          <button
            onClick={() => {
              setIsConnected(false);
              setAccount(null);
              setBalance(null);
              setWithdrawAmount('');
              toast.info('Wallet disconnected');
            }}
            className="w-full mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            Disconnect Wallet
          </button>
        </>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800">
        <p className="font-medium mb-2">How it works:</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Select network (testnet for testing)</li>
          <li>Connect your Temple Wallet</li>
          <li>Enter withdrawal amount (must exceed minimum + fees)</li>
          <li>Click "Withdraw XTZ" to initiate transaction</li>
          <li>Sign transaction in Temple Wallet</li>
          <li>Transaction confirmed on blockchain</li>
        </ol>
      </div>
    </div>
  );
};

export default TezosWithdrawUI;

/**
 * EXAMPLE: Integration in Admin Dashboard
 * 
 * In your admin page (e.g., pages/admin/ContractManagement.jsx):
 * 
 * import TezosWithdrawUI from '../../components/TezosWithdrawUI';
 * 
 * // Inside render:
 * {selectedNetwork === 'tezos' && <TezosWithdrawUI />}
 * 
 * This component handles all Tezos-specific UI and interaction,
 * while the admin dashboard remains network-agnostic.
 */
