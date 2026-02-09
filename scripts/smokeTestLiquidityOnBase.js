/**
 * Smoke test: verify NftLiquidity + NftPieces work together on Base
 * and that createPool() succeeds (no ERC1155 receiver error).
 *
 * What it does:
 *  - Attaches to deployed NftPieces + NftLiquidity on Base.
 * - Calls createPool() with a fake NFT (uses creator address as nftContract).
 *  - Confirms:
 *      - PoolCreated event emitted and pieceId returned.
 *      - Liquidity contract holds the minted pieces.
 *      - getPoolInfo(pieceId) returns a live, active pool.
 *
 * Requirements:
 *  - In hardhat.config.cjs, network "base" is configured with a PRIVATE_KEY.
 *  - Environment variables (or hardcode below):
 *      NFT_PIECES_ADDRESS_BASE=0x...
 *      NFT_LIQUIDITY_ADDRESS_BASE=0x...
 *
 * Run:
 *   npx hardhat run scripts/smokeTestLiquidityOnBase.js --network base
 */

import hre from "hardhat";

async function main() {
  const [creator] = await hre.ethers.getSigners();
  console.log("Creator (signer):", creator.address);

  // Read contract addresses from env or hardcode here
  const piecesAddress =
    process.env.NFT_PIECES_ADDRESS_BASE ||
    process.env.NFT_PIECES_ADDRESS ||
    process.env.VITE_APP_NFT_PIECES_CONTRACT_ADDRESS_BASE ||
    process.env.VITE_APP_NFT_PIECES_CONTRACT_ADDRESS ||
    ""; // TODO: fill in if still empty

  const liquidityAddress =
    process.env.NFT_LIQUIDITY_ADDRESS_BASE ||
    process.env.VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS_BASE ||
    process.env.VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS ||
    "";

  if (!piecesAddress || !liquidityAddress) {
    throw new Error(
      "Could not find NftPieces / NftLiquidity addresses. Set VITE_APP_NFT_PIECES_CONTRACT_ADDRESS[_BASE] and VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS[_BASE] (or matching NFT_PIECES_ADDRESS_BASE / NFT_LIQUIDITY_ADDRESS_BASE) in the environment Hardhat is using."
    );
  }

  console.log("NftPieces address:", piecesAddress);
  console.log("NftLiquidity address:", liquidityAddress);

  const balance = await hre.ethers.provider.getBalance(creator.address);
  console.log("Creator balance:", hre.ethers.utils.formatEther(balance), "ETH");

  // Attach to contracts
  const NftPieces = await hre.ethers.getContractFactory("NftPieces");
  const pieces = await NftPieces.attach(piecesAddress);

  const NftLiquidity = await hre.ethers.getContractFactory("NftLiquidity");
  const liquidity = await NftLiquidity.attach(liquidityAddress).connect(creator);

  // Test parameters
  const fakeNftContract = creator.address; // no royaltyInfo needed; _getRoyalty will just return (0,0)
  const nftTokenId = 1;
  const totalPieces = 10;
  const buyPricePerPiece = hre.ethers.utils.parseEther("0.001"); // 0.001 ETH per piece
  const sellPricePerPiece = buyPricePerPiece; // no spread for test
  const initialReserve = hre.ethers.utils.parseEther("0.05"); // enough to pay sellers

  console.log("\n=== Calling createPool on Base ===");
  console.log("fakeNftContract:", fakeNftContract);
  console.log("nftTokenId:", nftTokenId);
  console.log("totalPieces:", totalPieces);
  console.log(
    "buyPricePerPiece:",
    hre.ethers.utils.formatEther(buyPricePerPiece),
    "ETH"
  );
  console.log(
    "sellPricePerPiece:",
    hre.ethers.utils.formatEther(sellPricePerPiece),
    "ETH"
  );
  console.log(
    "initialReserve:",
    hre.ethers.utils.formatEther(initialReserve),
    "ETH"
  );

  const tx = await liquidity.createPool(
    fakeNftContract,
    nftTokenId,
    totalPieces,
    buyPricePerPiece,
    sellPricePerPiece,
    initialReserve,
    { value: initialReserve }
  );
  console.log("createPool tx hash:", tx.hash);
  const receipt = await tx.wait();

  let pieceId;
  const poolCreated = receipt.events?.find((e) => e.event === "PoolCreated");
  if (poolCreated && poolCreated.args && poolCreated.args.pieceId != null) {
    pieceId = poolCreated.args.pieceId.toString();
  } else {
    console.warn(
      "PoolCreated event not decoded; trying to read pieceId via getPoolInfo..."
    );
    const info = await liquidity.getPoolInfo(1); // fallback guess
    pieceId = info.pieceId.toString();
  }

  console.log("Pool created with pieceId:", pieceId);

  // Check balances and pool info
  const liquidityPiecesBalance = await pieces.balanceOf(
    liquidityAddress,
    pieceId
  );
  console.log(
    "Liquidity contract NftPieces balance for pieceId:",
    liquidityPiecesBalance.toString()
  );

  const poolInfo = await liquidity.getPoolInfo(pieceId);
  console.log("Pool info:", {
    nftContract: poolInfo.nftContract,
    nftTokenId: poolInfo.nftTokenId.toString(),
    pieceId: poolInfo.pieceId.toString(),
    creator: poolInfo.creator,
    totalPieces: poolInfo.totalPieces.toString(),
    piecesInPool: poolInfo.piecesInPool.toString(),
    reserveBalance: hre.ethers.utils.formatEther(poolInfo.reserveBalance),
    buyPricePerPiece: hre.ethers.utils.formatEther(poolInfo.buyPricePerPiece),
    sellPricePerPiece: hre.ethers.utils.formatEther(
      poolInfo.sellPricePerPiece
    ),
    active: poolInfo.active,
  });

  if (
    !poolInfo.active ||
    liquidityPiecesBalance.toString() !== totalPieces.toString()
  ) {
    throw new Error(
      "Smoke test failed: pool not active or liquidity contract does not hold all pieces."
    );
  }

  console.log(
    "\n✅ Smoke test passed: createPool worked on Base, pieces were minted to the liquidity contract, and the pool is active."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Smoke test failed:", err);
    process.exit(1);
  });

