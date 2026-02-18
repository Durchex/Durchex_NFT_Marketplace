#!/usr/bin/env node
import { ethers } from 'ethers';

const RPC = process.argv[2] || process.env.RPC_URL || 'https://mainnet.base.org';
const PIECES = process.argv[3] || process.env.PIECES || '0x40aE4EAd2a2031120c08C84f2da1d6BeA13e5afE';
const WALLET = (process.argv[4] || process.env.WALLET || '').toLowerCase();
const FROM = process.argv[5] || process.env.FROM_BLOCK || 'latest-500000';
const TO = process.argv[6] || process.env.TO_BLOCK || 'latest';

if (!WALLET) {
  console.error('Usage: node scripts/fetchLogsForWallet.js <rpc> <pieces> <wallet> <fromBlock> <toBlock>');
  process.exit(2);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const iface = new ethers.utils.Interface([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
]);

(async function main(){
  try {
    const latestBn = await provider.getBlockNumber();
    let fromBn = 0;
    if (FROM === 'latest-500000') fromBn = Math.max(0, latestBn - 500000);
    else if (FROM.startsWith('latest-')) fromBn = Math.max(0, latestBn - parseInt(FROM.split('-')[1] || '500000'));
    else fromBn = Number(FROM);
    let toBn = TO === 'latest' ? latestBn : Number(TO);
    console.log('Using RPC', RPC);
    console.log('Block range', fromBn, '->', toBn);

    const topic0 = ethers.utils.id('TransferSingle(address,address,address,uint256,uint256)');
    const topicTo = '0x' + WALLET.replace(/^0x/, '').padStart(64, '0');
    const filter = {
      address: PIECES,
      fromBlock: ethers.utils.hexValue(fromBn),
      toBlock: ethers.utils.hexValue(toBn),
      topics: [topic0, null, null, topicTo]
    };

    console.log('Querying logs...');
    const logs = await provider.getLogs(filter);
    console.log('Found', logs.length, 'logs');
    for (const l of logs) {
      try {
        const parsed = iface.parseLog(l);
        console.log({ blockNumber: l.blockNumber, txHash: l.transactionHash, args: { operator: parsed.args.operator, from: parsed.args.from, to: parsed.args.to, id: parsed.args.id.toString(), value: parsed.args.value.toString() } });
      } catch (e) {
        console.log('Unable to parse log', l.transactionHash, e.message);
      }
    }
  } catch (err) {
    console.error('Error fetching logs:', err.message || err);
    process.exit(1);
  }
})();