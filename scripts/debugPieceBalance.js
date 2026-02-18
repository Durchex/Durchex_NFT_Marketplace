#!/usr/bin/env node
import { ethers } from 'ethers';

async function main() {
  const rpc = process.env.RPC_URL || process.argv[2];
  const piecesAddress = process.env.PIECES_ADDRESS || process.argv[3];
  const pieceId = process.env.PIECE_ID || process.argv[4];
  const wallet = process.env.WALLET || process.argv[5];

  if (!rpc || !piecesAddress || !pieceId || !wallet) {
    console.error('Usage: RPC_URL PIECES_CONTRACT_ADDRESS PIECE_ID WALLET_ADDRESS');
    console.error('Or set RPC_URL, PIECES_ADDRESS, PIECE_ID, WALLET env vars');
    process.exit(2);
  }

  const provider = new ethers.providers.JsonRpcProvider(rpc);

  const NftPieces_ABI = [
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
  ];

  const contract = new ethers.Contract(piecesAddress, NftPieces_ABI, provider);

  console.log('RPC:', rpc);
  console.log('Pieces contract:', piecesAddress);
  console.log('PieceId:', pieceId);
  console.log('Wallet:', wallet);

  try {
    const bal = await contract.balanceOf(wallet, pieceId);
    console.log('On-chain balanceOf:', bal.toString());
  } catch (err) {
    console.error('Error calling balanceOf:', err.message || err);
  }

  // Fetch TransferSingle events involving this wallet and pieceId in the last 10000 blocks
  try {
    const latest = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latest - 10000);
    console.log(`Searching TransferSingle logs from block ${fromBlock} to ${latest}...`);
    const filter = contract.filters.TransferSingle(null, null, null, null, null);
    const logs = await contract.queryFilter(filter, fromBlock, latest);
    const related = logs.filter(l => {
      try {
        const parsed = contract.interface.parseLog(l);
        const args = parsed.args;
        return (args.id.toString() === String(pieceId)) &&
          (args.from.toLowerCase() === wallet.toLowerCase() || args.to.toLowerCase() === wallet.toLowerCase());
      } catch (e) {
        return false;
      }
    });
    console.log(`Found ${related.length} TransferSingle logs for wallet and pieceId:`);
    related.slice(-20).forEach(l => {
      const p = contract.interface.parseLog(l);
      console.log({ blockNumber: l.blockNumber, txHash: l.transactionHash, from: p.args.from, to: p.args.to, id: p.args.id.toString(), value: p.args.value.toString() });
    });
  } catch (err) {
    console.error('Error querying logs:', err.message || err);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
