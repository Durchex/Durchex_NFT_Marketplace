#!/usr/bin/env node
/**
 * Audit liquidity pools and identify unfunded piece IDs
 * Helps operators prevent "Insufficient reserve" errors
 */
import { ethers } from 'ethers';

const RPC_URL = process.env.BASE_RPC_URL || process.env.RPC_URL || 'https://mainnet.base.org';

const NFTPIECES_ADDR = '0x40aE4EAd2a2031120c08C84f2da1d6BeA13e5afE';
const LIQUIDITY_ADDR = '0xDe75542068F623bAFF2549f30d807339a0dE754b';

async function auditLiquidityPools() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const erc1155Abi = ['function balanceOf(address,uint256) view returns (uint256)'];
  const contract = new ethers.Contract(NFTPIECES_ADDR, erc1155Abi, provider);

  console.log('Auditing liquidity pool reserves...\n');
  console.log(`NftPieces Contract: ${NFTPIECES_ADDR}`);
  console.log(`Liquidity Pool: ${LIQUIDITY_ADDR}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // Check piece IDs 1-100 (adjust range as needed)
  console.log('Scanning piece IDs 1-50 for reserve balance...\n');

  const unfunded = [];
  const funded = [];

  for (let pieceId = 1; pieceId <= 50; pieceId++) {
    try {
      const bn = await contract.balanceOf(LIQUIDITY_ADDR, pieceId);
      const balance = bn.toNumber();
      if (balance > 0) {
        funded.push({ pieceId, balance });
        console.log(`✅ Piece ID ${pieceId}: ${balance} in reserve`);
      } else {
        unfunded.push(pieceId);
      }
    } catch (e) {
      console.log(`⚠️  Piece ID ${pieceId}: Error checking balance (may not exist)`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Funded pieces: ${funded.length}`);
  funded.forEach(f => console.log(`  - Piece ${f.pieceId}: ${f.balance}`));

  if (unfunded.length > 0) {
    console.log(`\n❌ UNFUNDED pieces (will cause "Insufficient reserve"): ${unfunded.join(', ')}`);
    console.log('\nTo fix, fund the liquidity pool by transferring pieces:');
    console.log(`  - Use safeBatchTransferFrom on NftPieces contract`);
    console.log(`  - Transfer pieces to liquidity pool: ${LIQUIDITY_ADDR}`);
  } else {
    console.log('\n✅ All scanned pieces have reserves.');
  }
}

auditLiquidityPools().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
