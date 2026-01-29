/**
 * Deploy only LazyMintNFT (for Buy & Mint on the marketplace).
 *
 * Usage:
 *   npx hardhat run scripts/deploy-lazy-mint-only.js --network sepolia
 *   npx hardhat run scripts/deploy-lazy-mint-only.js --network polygon
 *   npx hardhat run scripts/deploy-lazy-mint-only.js --network localhost
 *
 * Requires in .env: PRIVATE_KEY (and optional RPC URL per network).
 * After deploy, add to .env:
 *   VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=<printed address>
 * Then rebuild the frontend if needed.
 */

const hre = require('hardhat');

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🚀 Deploying LazyMintNFT to ${networkName}...\n`);

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const LazyMintNFT = await hre.ethers.getContractFactory('LazyMintNFT');
  const lazyMint = await LazyMintNFT.deploy();
  await lazyMint.deployed();

  console.log('\n✅ LazyMintNFT deployed to:', lazyMint.address);
  console.log('\n--- COPY ONE OF THESE LINES INTO YOUR .env ---');
  console.log(`VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=${lazyMint.address}`);
  const envKey = `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS_${networkName.toUpperCase()}`;
  console.log(`# Or for ${networkName} only: ${envKey}=${lazyMint.address}`);
  console.log('--------------------------------------------------------');
  console.log('Then restart your frontend (or rebuild) so it picks up the new address.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
