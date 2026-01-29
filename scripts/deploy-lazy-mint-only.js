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
  console.log('\n--- Add this to your .env (project root or frontend) ---');
  console.log(`VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=${lazyMint.address}`);
  console.log('--------------------------------------------------------\n');

  // Optional: per-network env var (e.g. for Sepolia)
  const envKey = `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS_${networkName.toUpperCase()}`;
  console.log(`Or for this network only: ${envKey}=${lazyMint.address}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
