// SPDX-License-Identifier: MIT
/**
 * Deploy CreatorLiquidity (creator-backed liquidity pool) using the existing
 * NftPieces ERC-1155 contract.
 *
 * Usage:
 *   PRIVATE_KEY=... SEPOLIA_RPC_URL=... NFT_PIECES_ADDRESS=0x... npx hardhat run scripts/deployCreatorLiquidity.js --network sepolia
 *
 * Env:
 *   - NFT_PIECES_ADDRESS: address of an already-deployed NftPieces contract
 *   - PLATFORM_FEE_RECEIVER (optional): address to receive platform fees
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying CreatorLiquidity with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const piecesAddress = process.env.NFT_PIECES_ADDRESS;
  if (!piecesAddress) {
    throw new Error("NFT_PIECES_ADDRESS env var is required (address of NftPieces)");
  }
  const platformFeeReceiver = process.env.PLATFORM_FEE_RECEIVER || deployer.address;

  console.log("\n1. Using existing NftPieces at:", piecesAddress);

  console.log("\n2. Deploying CreatorLiquidity...");
  const CreatorLiquidity = await hre.ethers.getContractFactory("CreatorLiquidity");
  const liquidity = await CreatorLiquidity.deploy(piecesAddress, platformFeeReceiver);
  await liquidity.waitForDeployment();
  const liquidityAddress = await liquidity.getAddress();
  console.log("CreatorLiquidity deployed to:", liquidityAddress);

  console.log("\n3. (Optional) Point NftPieces.liquidityContract to CreatorLiquidity if you want it as the default pool:");
  console.log("   - From a Hardhat task or script, call:");
  console.log("       const pieces = await hre.ethers.getContractAt('NftPieces', '" + piecesAddress + "');");
  console.log("       await pieces.setLiquidityContract('" + liquidityAddress + "');");

  console.log("\n--- Summary ---");
  console.log("NftPieces:", piecesAddress);
  console.log("CreatorLiquidity:", liquidityAddress);
  console.log("Platform fee receiver:", platformFeeReceiver);
  console.log("\nNext steps:");
  console.log(" 1) Set VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS (and per-network variants) in the frontend .env to", liquidityAddress);
  console.log(" 2) For each NFT you want a creator-backed pool on, call CreatorLiquidity.createPool(...) from the creator wallet");
  console.log(" 3) Store { liquidityContract, liquidityPieceId } for that NFT in your backend (nftModel / LazyNFT)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

