/**
 * Test script: sell flow for NFT pieces (NftPieces + NftLiquidity).
 * Verifies that when a seller calls sellPieces:
 *   1. Pieces leave the seller's wallet (ERC-1155 balance decreases).
 *   2. Seller is credited (receives ETH).
 *
 * Without prior approval (setApprovalForAll) of the liquidity contract on NftPieces,
 * sellPieces reverts because safeTransferFrom(seller -> liquidity) is not allowed.
 *
 * Run (uses in-memory accounts; no .env needed):
 *   npx hardhat run scripts/testSellFlow.js --network hardhat
 *
 * If your hardhat.config validates other networks and fails, run only the built-in network:
 *   npx hardhat run scripts/testSellFlow.js --network hardhat
 */

const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  if (signers.length < 2) throw new Error("Need at least 2 signers (creator, buyer). Use --network hardhat.");
  const [creator, buyer] = signers;
  const buyPrice = hre.ethers.utils.parseEther("0.01");
  const sellPrice = hre.ethers.utils.parseEther("0.01");
  const totalPieces = 10;
  const initialReserve = hre.ethers.utils.parseEther("0.2"); // enough to pay sellers
  const fakeNftContract = creator.address; // no royaltyInfo, so royalty = 0
  const fakeNftTokenId = 1;

  console.log("=== Sell flow test ===\n");
  console.log("Creator:", creator.address);
  console.log("Buyer (will buy then sell):", buyer.address);

  // 1. Deploy NftPieces
  const NftPieces = await hre.ethers.getContractFactory("NftPieces");
  const pieces = await NftPieces.deploy(
    "https://api.example.com/pieces/",
    hre.ethers.constants.AddressZero
  );
  await pieces.deployed();
  console.log("\nNftPieces:", pieces.address);

  // 2. Deploy NftLiquidity
  const NftLiquidity = await hre.ethers.getContractFactory("NftLiquidity");
  const liquidity = await NftLiquidity.deploy(pieces.address, creator.address);
  await liquidity.deployed();
  console.log("NftLiquidity:", liquidity.address);

  // 3. Link pieces -> liquidity
  await (await pieces.setLiquidityContract(liquidity.address)).wait();
  console.log("NftPieces.liquidityContract set.");

  // 4. Creator creates pool (with initial reserve so we can pay sellers)
  const createTx = await liquidity.connect(creator).createPool(
    fakeNftContract,
    fakeNftTokenId,
    totalPieces,
    buyPrice,
    sellPrice,
    initialReserve,
    { value: initialReserve }
  );
  const createReceipt = await createTx.wait();
  const poolCreatedEvent = createReceipt.events?.find((e) => e.event === "PoolCreated");
  const pieceId = poolCreatedEvent?.args?.pieceId ?? createReceipt.logs?.[0]?.topics?.[1];
  const pieceIdBn = typeof pieceId === "object" ? pieceId : hre.ethers.BigNumber.from(pieceId || "1");
  console.log("Pool created, pieceId:", pieceIdBn.toString());

  // 5. Buyer buys 2 pieces
  const buyQty = 2;
  const buyCost = buyPrice.mul(buyQty);
  await (
    await liquidity.connect(buyer).buyPieces(pieceIdBn, buyQty, { value: buyCost })
  ).wait();
  console.log("Buyer bought", buyQty, "pieces.");

  const buyerPiecesAfterBuy = await pieces.balanceOf(buyer.address, pieceIdBn);
  console.log("Buyer piece balance after buy:", buyerPiecesAfterBuy.toString());
  if (buyerPiecesAfterBuy.lt(buyQty)) {
    throw new Error("FAIL: Buyer should have " + buyQty + " pieces after buy, got " + buyerPiecesAfterBuy.toString());
  }

  const buyerEthBeforeSell = await hre.ethers.provider.getBalance(buyer.address);
  const liquidityPiecesBeforeSell = await pieces.balanceOf(liquidity.address, pieceIdBn);

  // 6. Buyer approves liquidity contract to transfer pieces (required for sellPieces)
  await (
    await pieces.connect(buyer).setApprovalForAll(liquidity.address, true)
  ).wait();
  console.log("Buyer approved liquidity contract.");

  // 7. Buyer sells 1 piece
  const sellQty = 1;
  console.log("\n--- Selling", sellQty, "piece(s) ---");
  const sellTx = await liquidity.connect(buyer).sellPieces(pieceIdBn, sellQty);
  const sellReceipt = await sellTx.wait();
  console.log("sellPieces tx hash:", sellReceipt.transactionHash);

  // 8. Assert: pieces left seller's wallet
  const buyerPiecesAfterSell = await pieces.balanceOf(buyer.address, pieceIdBn);
  const expectedBuyerPieces = buyerPiecesAfterBuy.sub(sellQty);
  console.log("Buyer piece balance after sell:", buyerPiecesAfterSell.toString(), "(expected", expectedBuyerPieces.toString() + ")");
  if (!buyerPiecesAfterSell.eq(expectedBuyerPieces)) {
    throw new Error(
      "FAIL: NFT pieces did not leave seller wallet. Expected " +
        expectedBuyerPieces.toString() +
        ", got " +
        buyerPiecesAfterSell.toString()
    );
  }

  // 9. Assert: liquidity contract received the pieces
  const liquidityPiecesAfterSell = await pieces.balanceOf(liquidity.address, pieceIdBn);
  const expectedLiquidityPieces = liquidityPiecesBeforeSell.add(sellQty);
  console.log("Liquidity contract piece balance after sell:", liquidityPiecesAfterSell.toString(), "(expected", expectedLiquidityPieces.toString() + ")");
  if (!liquidityPiecesAfterSell.eq(expectedLiquidityPieces)) {
    throw new Error(
      "FAIL: Pieces did not arrive at liquidity contract. Expected " +
        expectedLiquidityPieces.toString() +
        ", got " +
        liquidityPiecesAfterSell.toString()
    );
  }

  // 10. Assert: seller was credited (ETH balance increased)
  const buyerEthAfterSell = await hre.ethers.provider.getBalance(buyer.address);
  const gasUsed = sellReceipt.gasUsed.mul(sellReceipt.effectiveGasPrice || 0);
  const netEthChange = buyerEthAfterSell.sub(buyerEthBeforeSell).add(gasUsed);
  const expectedProceeds = sellPrice.mul(sellQty);
  const platformFeeBps = await liquidity.platformFeeBps();
  const platformFee = expectedProceeds.mul(platformFeeBps).div(10000);
  const expectedSellerReceives = expectedProceeds.sub(platformFee); // no royalty (fake NFT)
  console.log("Seller ETH before sell:", hre.ethers.utils.formatEther(buyerEthBeforeSell));
  console.log("Seller ETH after sell:", hre.ethers.utils.formatEther(buyerEthAfterSell));
  console.log("Gas spent:", hre.ethers.utils.formatEther(gasUsed));
  console.log("Net ETH change (including gas):", hre.ethers.utils.formatEther(netEthChange));
  console.log("Expected proceeds (after fee):", hre.ethers.utils.formatEther(expectedSellerReceives));
  if (netEthChange.lt(expectedSellerReceives.sub(hre.ethers.utils.parseEther("0.0001")))) {
    throw new Error(
      "FAIL: Seller was not credited. Net ETH change " +
        hre.ethers.utils.formatEther(netEthChange) +
        " expected at least " +
        hre.ethers.utils.formatEther(expectedSellerReceives)
    );
  }

  console.log("\n=== All checks passed: pieces left wallet, seller was credited. ===");

  // --- Optional: prove that without approval, sell reverts (no transfer, no credit) ---
  console.log("\n--- Proving sell reverts without approval ---");
  const buyer2 = signers.length >= 3 ? signers[2] : null;
  if (buyer2) {
    await (await liquidity.connect(buyer2).buyPieces(pieceIdBn, 1, { value: buyPrice })).wait();
    const balanceBefore = await pieces.balanceOf(buyer2.address, pieceIdBn);
    const ethBefore = await hre.ethers.provider.getBalance(buyer2.address);
    try {
      await liquidity.connect(buyer2).sellPieces(pieceIdBn, 1);
      throw new Error("FAIL: sellPieces should have reverted (no approval).");
    } catch (e) {
      if (e.message.includes("FAIL:")) throw e;
      console.log("Expected revert (no approval):", e.message?.slice(0, 80) + "...");
    }
    const balanceAfter = await pieces.balanceOf(buyer2.address, pieceIdBn);
    const ethAfter = await hre.ethers.provider.getBalance(buyer2.address);
    if (!balanceAfter.eq(balanceBefore)) throw new Error("FAIL: Piece balance should be unchanged when sell reverts.");
    if (!ethAfter.eq(ethBefore)) throw new Error("FAIL: ETH balance should be unchanged when sell reverts.");
    console.log("Without approval: pieces stayed in wallet, no ETH paid (tx reverted).");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
