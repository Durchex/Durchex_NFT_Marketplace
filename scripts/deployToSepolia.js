// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * SEPOLIA TESTNET DEPLOYMENT SCRIPT
 * 
 * This file demonstrates how to deploy the smart contracts to Sepolia
 * 
 * Steps:
 * 1. Set environment variables
 * 2. Run: npx hardhat run scripts/deployToSepolia.js --network sepolia
 * 3. Verify contracts on Etherscan
 * 4. Test collection creation and NFT minting
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying to Sepolia Testnet...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // 1. Deploy DurchexNFT template contract
  console.log("\n1️⃣ Deploying DurchexNFT template...");
  const DurchexNFT = await hre.ethers.getContractFactory("DurchexNFT");
  const template = await DurchexNFT.deploy();
  await template.waitForDeployment();
  const templateAddress = await template.getAddress();
  console.log(`✅ Template deployed to: ${templateAddress}`);

  // 2. Deploy NFTCollectionFactory
  console.log("\n2️⃣ Deploying NFTCollectionFactory...");
  const NFTCollectionFactory = await hre.ethers.getContractFactory("NFTCollectionFactory");
  const factory = await NFTCollectionFactory.deploy(templateAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ Factory deployed to: ${factoryAddress}`);

  // 3. Test: Create a test collection
  console.log("\n3️⃣ Creating test collection...");
  const collectionName = "Test NFT Collection";
  const collectionSymbol = "TEST";
  const royaltyPercentage = 250; // 2.5%
  const royaltyRecipient = deployer.address;

  const createTx = await factory.createCollection(
    collectionName,
    collectionSymbol,
    royaltyPercentage,
    royaltyRecipient
  );

  const receipt = await createTx.wait();
  console.log(`✅ Collection creation tx: ${createTx.hash}`);

  // Extract collection address from events
  const event = receipt.logs
    .map(log => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(e => e && e.name === "CollectionCreated");

  const collectionAddress = event ? event.args.collectionAddress : null;
  console.log(`✅ Collection deployed to: ${collectionAddress}`);

  // 4. Test: Mint an NFT on the collection
  if (collectionAddress) {
    console.log("\n4️⃣ Minting test NFT...");
    
    // Simple metadata URI (normally would be IPFS)
    const metadataURI = "ipfs://QmTest123/metadata.json";
    
    const nftABI = [
      "function mint(address to, string uri) public returns (uint256)",
      "function getNextTokenId() public view returns (uint256)"
    ];

    const nftContract = new hre.ethers.Contract(
      collectionAddress,
      nftABI,
      deployer
    );

    const mintTx = await nftContract.mint(deployer.address, metadataURI);
    const mintReceipt = await mintTx.wait();
    console.log(`✅ Mint tx: ${mintTx.hash}`);

    const tokenId = await nftContract.getNextTokenId();
    console.log(`✅ NFT minted with token ID: ${tokenId - 1n}`);
  }

  // 5. Save deployment info
  console.log("\n5️⃣ Saving deployment info...");
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      template: templateAddress,
      factory: factoryAddress,
      testCollection: collectionAddress
    },
    testMetadata: {
      collectionName,
      collectionSymbol,
      royaltyPercentage
    }
  };

  console.log("\n✅ DEPLOYMENT COMPLETE\n");
  console.log("Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Saved to: deployment-sepolia.json");
  console.log("\n🔗 Verify on Etherscan:");
  console.log(`   Template: https://sepolia.etherscan.io/address/${templateAddress}`);
  console.log(`   Factory: https://sepolia.etherscan.io/address/${factoryAddress}`);
  console.log(`   Collection: https://sepolia.etherscan.io/address/${collectionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
