// SPDX-License-Identifier: MIT
/**
 * Deploy NftPieces (ERC-1155) and NftLiquidity (on-chain buy/sell pieces, fees, royalties).
 *
 * Usage (ESM project):
 *   npx hardhat run scripts/deployNftPiecesAndLiquidity.js --network <network>
 *
 * Requires: PRIVATE_KEY and appropriate RPC URL in Hardhat config.
 */

import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  const baseUri = process.env.NFT_PIECES_BASE_URI || "https://api.durchex.com/metadata/pieces/";
  const platformFeeReceiver = process.env.PLATFORM_FEE_RECEIVER || deployer.address;

  // 1. Deploy NftPieces (liquidity contract not yet deployed, pass zero)
  console.log("\n1. Deploying NftPieces (ERC-1155)...");
  const NftPieces = await hre.ethers.getContractFactory("NftPieces");
  // Use AddressZero from ethers v5 constants (ZeroAddress is v6-only)
  const pieces = await NftPieces.deploy(baseUri, hre.ethers.constants.AddressZero);
  await pieces.waitForDeployment();
  const piecesAddress = await pieces.getAddress();
  console.log("NftPieces deployed to:", piecesAddress);

  // 2. Deploy NftLiquidity
  console.log("\n2. Deploying NftLiquidity...");
  const NftLiquidity = await hre.ethers.getContractFactory("NftLiquidity");
  const liquidity = await NftLiquidity.deploy(piecesAddress, deployer.address);
  await liquidity.waitForDeployment();
  const liquidityAddress = await liquidity.getAddress();
  console.log("NftLiquidity deployed to:", liquidityAddress);

  // 3. Set liquidity contract on NftPieces so it can call registerAndMint
  console.log("\n3. Setting liquidity contract on NftPieces...");
  const tx = await pieces.setLiquidityContract(liquidityAddress);
  await tx.wait();
  console.log("NftPieces.liquidityContract set to:", liquidityAddress);

  console.log("\n--- Summary ---");
  console.log("NftPieces:", piecesAddress);
  console.log("NftLiquidity:", liquidityAddress);
  console.log("Platform fee receiver:", platformFeeReceiver);
  console.log("\nNext: Set VITE_APP_NFT_PIECES_CONTRACT_ADDRESS and VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS (and _POLYGON, _ETHEREUM, etc.) in frontend .env");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
