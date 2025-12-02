import { ethers } from 'ethers';
import tokenRegistry from './tokenRegistry';

// Minimal Uniswap v3 helper using the Quoter and SwapRouter
// Note: This implementation is intentionally lightweight to avoid heavy SDK deps.
// It builds a calldata for exactInputSingle using ABI encoding and uses Quoter to estimate output.

const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // Uniswap V3 quoter (mainnet & polygon)
const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // SwapRouter

const QUOTER_ABI = [
  'function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'
];

const SWAP_ROUTER_ABI = [
  'function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint160)) payable returns (uint256 amountOut)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// helper to get decimals for a token address using provider
async function getDecimals(tokenAddress, provider) {
  if (!tokenAddress) return 18;
  const zero = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  if (tokenAddress.toLowerCase() === zero.toLowerCase()) return 18;
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const d = await token.decimals();
    return Number(d);
  } catch (err) {
    return 18;
  }
}

async function getQuoterAmountOut(provider, tokenIn, tokenOut, fee = 3000, amountInRaw) {
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
  const amountOut = await quoter.quoteExactInputSingle(tokenIn, tokenOut, fee, amountInRaw, 0);
  return amountOut; // BigNumber
}

async function buildExactInputSingleCalldata(tokenIn, tokenOut, fee, recipient, deadline, amountInRaw, amountOutMinimumRaw) {
  const iface = new ethers.utils.Interface(SWAP_ROUTER_ABI);
  // exactInputSingle expects a single tuple argument
  const params = [
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountInRaw,
    amountOutMinimumRaw,
    0,
  ];
  const data = iface.encodeFunctionData('exactInputSingle', [params]);
  return data;
}

async function getUniswapQuoteAndTx(provider, signerOrAddress, tokenIn, tokenOut, amountInDecimal, slippagePercent = 1, fee = 3000, network = 'ethereum') {
  try {
    const providerInstance = provider || (window.ethereum ? new ethers.providers.Web3Provider(window.ethereum) : null);
    if (!providerInstance) throw new Error('No provider available');

    // Resolve token addresses/decimals via registry if symbols provided
    const resolvedIn = tokenRegistry.resolve(tokenIn, network) || { address: tokenIn, decimals: 18 };
    const resolvedOut = tokenRegistry.resolve(tokenOut, network) || { address: tokenOut, decimals: 18 };
    const tokenInAddr = resolvedIn.address;
    const tokenOutAddr = resolvedOut.address;
    const decimalsIn = resolvedIn.decimals || await getDecimals(tokenInAddr, providerInstance);
    const amountInRaw = ethers.utils.parseUnits(String(amountInDecimal), decimalsIn);

    const amountOutRaw = await getQuoterAmountOut(providerInstance, tokenInAddr, tokenOutAddr, fee, amountInRaw);

    const slippageFactor = (100 - Number(slippagePercent)) / 100;
    const amountOutMinimumRaw = ethers.BigNumber.from(amountOutRaw).mul(Math.floor(slippageFactor * 1000000)).div(1000000);

    // Build calldata for SwapRouter exactInputSingle
    const recipient = typeof signerOrAddress === 'string' ? signerOrAddress : await signerOrAddress.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const data = await buildExactInputSingleCalldata(tokenInAddr, tokenOutAddr, fee, recipient, deadline, amountInRaw, amountOutMinimumRaw);

    const zeroAddr = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const txRequest = {
      to: SWAP_ROUTER_ADDRESS,
      data,
      value: (tokenInAddr && tokenInAddr.toLowerCase() === zeroAddr.toLowerCase()) ? amountInRaw : ethers.BigNumber.from('0'),
    };

    return {
      amountInRaw: amountInRaw.toString(),
      amountOutRaw: amountOutRaw.toString(),
      amountOutMinimumRaw: amountOutMinimumRaw.toString(),
      txRequest,
      fee,
      router: SWAP_ROUTER_ADDRESS,
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      resolvedIn,
      resolvedOut,
    };
  } catch (err) {
    throw err;
  }
}

async function approveIfNeeded(tokenAddress, signer, spender, amountRaw) {
  if (!tokenAddress) return { approved: true };
  const zero = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  if (tokenAddress.toLowerCase() === zero.toLowerCase()) return { approved: true };
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await token.allowance(owner, spender);
  if (allowance.gte(ethers.BigNumber.from(amountRaw))) return { approved: true };
  const tx = await token.approve(spender, amountRaw);
  await tx.wait();
  return { approved: true, tx };
}

async function executeUniswapSwap(quoteObj, signer) {
  try {
    // Approve if needed
    if (quoteObj && quoteObj.tokenIn) {
      await approveIfNeeded(quoteObj.tokenIn, signer, quoteObj.router || SWAP_ROUTER_ADDRESS, quoteObj.amountInRaw);
    }

    // Send transaction
    const tx = await signer.sendTransaction({ to: quoteObj.txRequest.to, data: quoteObj.txRequest.data, value: quoteObj.txRequest.value || ethers.BigNumber.from('0') });
    return tx;
  } catch (err) {
    throw err;
  }
}

export default {
  getUniswapQuoteAndTx,
  executeUniswapSwap,
  approveIfNeeded,
};
