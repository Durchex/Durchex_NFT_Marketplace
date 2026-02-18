import { ethers } from 'ethers';
import { depositModel } from '../models/depositModel.js';
import { creditPayout } from '../services/gameWalletService.js';

// POST /api/v1/payments/deposit
// Body: { walletAddress, transactionHash, network = 'base', tokenAddress, amount (human-readable), tokenDecimals? }
export const verifyDeposit = async (req, res) => {
  try {
    const { walletAddress, transactionHash, network = 'base', tokenAddress, amount, tokenDecimals } = req.body || {};
    if (!walletAddress || !transactionHash || !tokenAddress || !amount) {
      return res.status(400).json({ error: 'walletAddress, transactionHash, tokenAddress and amount are required' });
    }

    const net = String(network).toLowerCase();
    const w = String(walletAddress).toLowerCase();
    const txHash = String(transactionHash);

    const rpcUrl = process.env[`${String(net).toUpperCase()}_RPC_URL`] || process.env.RPC_URL || process.env.VITE_APP_WEB3_PROVIDER || process.env.BASE_RPC_URL || null;
    const depositAddr = (process.env.PAYMENT_DEPOSIT_ADDRESS || process.env.PAYMENT_WALLET_ADDRESS || '').toLowerCase();
    if (!depositAddr) {
      return res.status(500).json({ error: 'Server not configured: PAYMENT_DEPOSIT_ADDRESS must be set' });
    }
    if (!rpcUrl) {
      // Record pending deposit
      const pending = await depositModel.create({ network: net, wallet: w, tokenAddress: tokenAddress.toLowerCase(), amount: String(amount), chipsAwarded: 0, transactionHash: txHash, status: 'pending' });
      return res.status(202).json({ success: true, pending: true, id: pending._id, message: 'No RPC configured; deposit recorded as pending' });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    let receipt;
    try {
      receipt = await provider.getTransactionReceipt(txHash);
    } catch (e) {
      const pending = await depositModel.create({ network: net, wallet: w, tokenAddress: tokenAddress.toLowerCase(), amount: String(amount), chipsAwarded: 0, transactionHash: txHash, status: 'pending' });
      return res.status(202).json({ success: true, pending: true, id: pending._id, message: 'Transaction receipt not available yet; recorded pending deposit' });
    }

    if (!receipt || receipt.status !== 1) {
      const pending = await depositModel.create({ network: net, wallet: w, tokenAddress: tokenAddress.toLowerCase(), amount: String(amount), chipsAwarded: 0, transactionHash: txHash, status: 'pending' });
      return res.status(202).json({ success: true, pending: true, id: pending._id, message: 'Transaction not confirmed; recorded pending deposit' });
    }

    // Parse Transfer event logs for ERC20 Transfer(address,address,uint256)
    const erc20Iface = new ethers.utils.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
    let matched = false;
    let valueRaw = null;
    for (const log of receipt.logs) {
      try {
        const parsed = erc20Iface.parseLog(log);
        if (parsed && parsed.name === 'Transfer') {
          const to = String(parsed.args.to).toLowerCase();
          const from = String(parsed.args.from).toLowerCase();
          const addr = log.address.toLowerCase();
          if (addr === tokenAddress.toLowerCase() && to === depositAddr) {
            // someone transferred tokens into the configured platform deposit wallet
            valueRaw = parsed.args.value.toString();
            matched = true;
            break;
          }
        }
      } catch (e) {
        // ignore non-matching logs
      }
    }

    if (!matched) {
      const pending = await depositModel.create({ network: net, wallet: w, tokenAddress: tokenAddress.toLowerCase(), amount: String(amount), chipsAwarded: 0, transactionHash: txHash, status: 'pending' });
      return res.status(202).json({ success: true, pending: true, id: pending._id, message: 'No matching Transfer log to PAYMENT_DEPOSIT_ADDRESS observed; recorded pending deposit' });
    }

    // Determine decimals
    const decimals = typeof tokenDecimals === 'number' ? tokenDecimals : (process.env.TOKEN_DEFAULT_DECIMALS ? Number(process.env.TOKEN_DEFAULT_DECIMALS) : 6);
    // Convert raw value to human-readable
    const humanAmount = ethers.utils.formatUnits(valueRaw, decimals);

    // Convert USDT to chips using CHIPS_PER_USDT env (default 100)
    const chipsPerUnit = Number(process.env.CHIPS_PER_USDT || 100);
    const chipsAwarded = Math.floor(parseFloat(humanAmount) * chipsPerUnit);

    // Credit user's gameBalance (chips) using shared helper
    await creditPayout(w, chipsAwarded);

    const rec = await depositModel.create({ network: net, wallet: w, tokenAddress: tokenAddress.toLowerCase(), amount: String(humanAmount), amountRaw: String(valueRaw), tokenDecimals: decimals, chipsAwarded, transactionHash: txHash, status: 'verified' });

    // Emit socket event if available
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('user_activity_update', { type: 'deposit', wallet: w, chipsAwarded, network: net, transactionHash: txHash, timestamp: new Date() });
      }
    } catch (e) {}

    return res.json({ success: true, verified: true, chipsAwarded, deposit: rec });
  } catch (err) {
    console.error('payments.verifyDeposit error', err);
    return res.status(500).json({ error: err.message });
  }
};
