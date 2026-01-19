// Mainnet deployment script with safety checks
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers } = hre;

async function deployToMainnet() {
  console.log('🚀 Deploying Durchex NFT Marketplace to Ethereum Mainnet...\n');

  // Verify network
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1) {
    throw new Error(`Wrong network! Current chain ID: ${network.chainId}, expected 1 (Mainnet)`);
  }
  console.log(`✓ Connected to Mainnet (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`✓ Deployer: ${deployer.address}`);
  console.log(`✓ Balance: ${ethers.formatEther(deployerBalance)} ETH\n`);

  // Check for sufficient funds (minimum 2 ETH for all deployments)
  const minBalance = ethers.parseEther('2');
  if (deployerBalance < minBalance) {
    throw new Error(
      `Insufficient balance! Have ${ethers.formatEther(deployerBalance)} ETH, need at least 2 ETH`
    );
  }

  // Production configuration
  const platformWallet = process.env.MAINNET_PLATFORM_WALLET || deployer.address;
  const multisigAddress = process.env.MAINNET_MULTISIG_ADDRESS;

  if (!multisigAddress) {
    throw new Error('MAINNET_MULTISIG_ADDRESS not set! Multi-sig wallet required for production.');
  }

  console.log(`✓ Platform Wallet: ${platformWallet}`);
  console.log(`✓ Multi-Sig Address: ${multisigAddress}\n`);

  const deploymentAddresses = {};
  const deploymentTx = [];
  let totalGasUsed = ethers.toBigInt(0);

  try {
    // Deploy LazyMintNFT
    console.log('Deploying LazyMintNFT...');
    const LazyMintNFT = await ethers.getContractFactory('LazyMintNFT');
    const lazyMint = await LazyMintNFT.deploy(platformWallet, {
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
    });
    await lazyMint.waitForDeployment();
    deploymentAddresses.lazyMint = await lazyMint.getAddress();
    console.log(`✓ LazyMintNFT deployed: ${deploymentAddresses.lazyMint}\n`);

    // Deploy Auction
    console.log('Deploying Auction...');
    const Auction = await ethers.getContractFactory('Auction');
    const auction = await Auction.deploy(deploymentAddresses.lazyMint, platformWallet, {
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
    });
    await auction.waitForDeployment();
    deploymentAddresses.auction = await auction.getAddress();
    console.log(`✓ Auction deployed: ${deploymentAddresses.auction}\n`);

    // Deploy Offer
    console.log('Deploying Offer...');
    const Offer = await ethers.getContractFactory('Offer');
    const offer = await Offer.deploy(deploymentAddresses.lazyMint, platformWallet, {
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
    });
    await offer.waitForDeployment();
    deploymentAddresses.offer = await offer.getAddress();
    console.log(`✓ Offer deployed: ${deploymentAddresses.offer}\n`);

    // Deploy Collection
    console.log('Deploying Collection...');
    const Collection = await ethers.getContractFactory('Collection');
    const collection = await Collection.deploy(platformWallet, {
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
    });
    await collection.waitForDeployment();
    deploymentAddresses.collection = await collection.getAddress();
    console.log(`✓ Collection deployed: ${deploymentAddresses.collection}\n`);

    // Deploy Royalties
    console.log('Deploying Royalties...');
    const Royalties = await ethers.getContractFactory('Royalties');
    const royalties = await Royalties.deploy(
      deploymentAddresses.lazyMint,
      deploymentAddresses.auction,
      deploymentAddresses.offer,
      platformWallet,
      {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      }
    );
    await royalties.waitForDeployment();
    deploymentAddresses.royalties = await royalties.getAddress();
    console.log(`✓ Royalties deployed: ${deploymentAddresses.royalties}\n`);

    // Transfer ownership to multi-sig
    console.log('Transferring ownership to Multi-Sig...');
    await lazyMint.transferOwnership(multisigAddress);
    await auction.transferOwnership(multisigAddress);
    await offer.transferOwnership(multisigAddress);
    await collection.transferOwnership(multisigAddress);
    await royalties.transferOwnership(multisigAddress);
    console.log('✓ All contracts transferred to multi-sig\n');

    // Save deployment info
    const deploymentInfo = {
      network: 'mainnet',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      multisig: multisigAddress,
      contracts: deploymentAddresses,
      totalGasUsed: totalGasUsed.toString(),
      blockNumber: await ethers.provider.getBlockNumber(),
    };

    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentDir, 'mainnet-latest.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    fs.writeFileSync(
      path.join(deploymentDir, `mainnet-${Date.now()}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    // Export to frontend
    const contractAddresses = {
      lazyMint: deploymentAddresses.lazyMint,
      auction: deploymentAddresses.auction,
      offer: deploymentAddresses.offer,
      collection: deploymentAddresses.collection,
      royalties: deploymentAddresses.royalties,
      chainId: 1,
      network: 'mainnet',
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      './frontend/src/contracts/addresses.mainnet.json',
      JSON.stringify(contractAddresses, null, 2)
    );

    console.log('✅ Mainnet deployment complete!\n');
    console.log('📋 Contract Addresses:');
    Object.entries(deploymentAddresses).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    console.log('\n📝 Next steps:');
    console.log('1. Verify contracts on Etherscan:');
    console.log(`   npx hardhat verify --network mainnet ${deploymentAddresses.lazyMint} "${platformWallet}"`);
    console.log('2. Update backend contract addresses');
    console.log('3. Run post-deployment security checks');
    console.log('4. Enable multi-sig contract execution');

    return deploymentAddresses;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
deployToMainnet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
