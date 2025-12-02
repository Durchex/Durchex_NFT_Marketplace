import { ethers } from 'ethers';
import tokenRegistry from './tokenRegistry';

const API_BASE = 'https://api.0x.org';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
];

async function get0xQuote(sellToken, buyToken, sellAmountDecimal, takerAddress, slippagePercent = 1, network = 'ethereum') {
  // sellToken/buyToken can be token symbols or addresses; network selects registry for decimals/addresses
  try {
    const sellResolved = tokenRegistry.resolve(sellToken, network) || { address: sellToken, decimals: 18 };
    const buyResolved = tokenRegistry.resolve(buyToken, network) || { address: buyToken, decimals: 18 };

    const sellAmountBase = ethers.utils.parseUnits(String(sellAmountDecimal), sellResolved.decimals).toString();
    const params = new URLSearchParams();
    params.set('sellToken', sellResolved.address);
    params.set('buyToken', buyResolved.address);
    params.set('sellAmount', sellAmountBase);
    if (takerAddress) params.set('takerAddress', takerAddress);
    if (slippagePercent) params.set('slippagePercentage', String(Number(slippagePercent) / 100));

    const url = `${API_BASE}/swap/v1/quote?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`0x quote failed: ${res.status} ${txt}`);
    }
    const json = await res.json();
    // attach resolved addresses/decimals for downstream use
    json._sellResolved = sellResolved;
    json._buyResolved = buyResolved;
    return json;
  } catch (err) {
    throw err;
  }
}

async function approveIfNeeded(sellTokenAddress, signer, allowanceTarget, amountRaw) {
  if (!sellTokenAddress) return { approved: true };
  const zeroExNative = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  if (sellTokenAddress.toLowerCase() === zeroExNative.toLowerCase()) return { approved: true };

  const tokenContract = new ethers.Contract(sellTokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  let decimals = 18;
  try { decimals = await tokenContract.decimals(); } catch (e) { /* ignore */ }

  const amountBN = ethers.BigNumber.from(amountRaw.toString());
  const allowance = await tokenContract.allowance(owner, allowanceTarget);
  if (allowance.gte(amountBN)) return { approved: true };

  const tx = await tokenContract.approve(allowanceTarget, amountBN);
  await tx.wait();
  return { approved: true, tx };
}

async function executeSwap(quote, signer) {
  // quote: 0x quote response
  try {
    // Perform approval if needed
    if (quote.allowanceTarget && quote.sellTokenAddress) {
      await approveIfNeeded(quote.sellTokenAddress, signer, quote.allowanceTarget, quote.sellAmount || quote.sellAmountBase || quote.sellAmount);
    }

    const txRequest = {
      to: quote.to,
      data: quote.data,
      value: quote.value ? ethers.BigNumber.from(quote.value) : ethers.BigNumber.from('0'),
    };
    const tx = await signer.sendTransaction(txRequest);
    return tx;
  } catch (err) {
    throw err;
  }
}

export default {
  get0xQuote,
  executeSwap,
  approveIfNeeded,
};
