#!/usr/bin/env node
import { ethers } from 'ethers';

// Decode the transaction data from the error
const data = '0x124e0c1e00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001';

console.log('Transaction data: ' + data);
console.log('Function selector: ' + data.slice(0, 10));

// Try to decode common function signatures
const signatures = [
  'sellPieces(uint256,uint256)',
  'sellToLiquidity(uint256,uint256)',
  'burn(uint256,uint256)',
  'transfer(address,uint256)',
  'safeTransferFrom(address,address,uint256,uint256,bytes)'
];

console.log('\nTrying to match function selector...');
signatures.forEach(sig => {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(sig));
  const selector = hash.slice(0, 10);
  if (selector === data.slice(0, 10)) {
    console.log(`✅ MATCH: ${sig}`);
    console.log(`   Hash: ${hash}`);
  }
});

// Manual parameter parsing
console.log('\nParameter parsing:');
const params = data.slice(10); // Remove function selector
const param1 = '0x' + params.slice(0, 64);
const param2 = '0x' + params.slice(64, 128);

console.log(`Param 1 (offset/pieceId): ${ethers.BigNumber.from(param1).toString()}`);
console.log(`Param 2 (quantity/amount): ${ethers.BigNumber.from(param2).toString()}`);

// Decode if it's safeTransferFrom
if (data.slice(0, 10) === '0xf242432a') {
  console.log('\n(Likely safeTransferFrom with ABI encoded params)');
}
