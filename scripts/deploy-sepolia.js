/**
 * scripts/deploy-sepolia.js
 * Deployment script for Sepolia testnet
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const DEPLOYMENTS_DIR = path.join(__dirname, '../deployments/sepolia');

// Ensure deployments directory exists
if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

async function main() {
    console.log('🚀 Starting Sepolia testnet deployment...\n');

    const [deployer] = await hre.ethers.getSigners();
    console.log(`📝 Deploying contracts with account: ${deployer.address}`);

    const deploymentLog = {
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        network: 'sepolia',
        chainId: 11155111,
        contracts: {},
    };

    try {
        // 1. Deploy LazyMintNFT
        console.log('\n1️⃣ Deploying LazyMintNFT...');
        const LazyMintNFT = await hre.ethers.getContractFactory('LazyMintNFT');
        const lazyMint = await LazyMintNFT.deploy();
        await lazyMint.deployed();
        console.log(`✅ LazyMintNFT deployed to: ${lazyMint.address}`);

        deploymentLog.contracts.LazyMintNFT = {
            address: lazyMint.address,
            blockNumber: lazyMint.deployTransaction.blockNumber,
            txHash: lazyMint.deployTransaction.hash,
        };

        // 2. Deploy Auction
        console.log('\n2️⃣ Deploying Auction...');
        const Auction = await hre.ethers.getContractFactory('Auction');
        const auction = await Auction.deploy();
        await auction.deployed();
        console.log(`✅ Auction deployed to: ${auction.address}`);

        deploymentLog.contracts.Auction = {
            address: auction.address,
            blockNumber: auction.deployTransaction.blockNumber,
            txHash: auction.deployTransaction.hash,
        };

        // 3. Deploy Offer
        console.log('\n3️⃣ Deploying Offer...');
        const Offer = await hre.ethers.getContractFactory('Offer');
        const offer = await Offer.deploy();
        await offer.deployed();
        console.log(`✅ Offer deployed to: ${offer.address}`);

        deploymentLog.contracts.Offer = {
            address: offer.address,
            blockNumber: offer.deployTransaction.blockNumber,
            txHash: offer.deployTransaction.hash,
        };

        // 4. Deploy Collection
        console.log('\n4️⃣ Deploying Collection...');
        const Collection = await hre.ethers.getContractFactory('Collection');
        const collection = await Collection.deploy();
        await collection.deployed();
        console.log(`✅ Collection deployed to: ${collection.address}`);

        deploymentLog.contracts.Collection = {
            address: collection.address,
            blockNumber: collection.deployTransaction.blockNumber,
            txHash: collection.deployTransaction.hash,
        };

        // 5. Deploy Royalties
        console.log('\n5️⃣ Deploying Royalties...');
        const Royalties = await hre.ethers.getContractFactory('Royalties');
        const royalties = await Royalties.deploy();
        await royalties.deployed();
        console.log(`✅ Royalties deployed to: ${royalties.address}`);

        deploymentLog.contracts.Royalties = {
            address: royalties.address,
            blockNumber: royalties.deployTransaction.blockNumber,
            txHash: royalties.deployTransaction.hash,
        };

        // 6. Initialize inter-contract connections
        console.log('\n🔗 Setting up contract connections...');
        
        // Grant roles if needed
        console.log('   - Setting up access control...');
        
        // Update Platform fee in Royalties
        await royalties.setPlatformWallet(deployer.address);
        console.log('   ✓ Platform wallet set');

        // 7. Save deployment info
        const deploymentInfo = {
            ...deploymentLog,
            environment: 'testnet',
            rpcUrl: process.env.SEPOLIA_RPC_URL,
            explorerUrl: 'https://sepolia.etherscan.io',
        };

        const deploymentPath = path.join(DEPLOYMENTS_DIR, `deployment-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

        // Also save latest deployment
        const latestPath = path.join(DEPLOYMENTS_DIR, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

        // 8. Export contract addresses for frontend
        const contractsPath = path.join(__dirname, '../frontend/src/contracts/addresses.json');
        const addresses = {
            sepolia: {
                LazyMintNFT: lazyMint.address,
                Auction: auction.address,
                Offer: offer.address,
                Collection: collection.address,
                Royalties: royalties.address,
            },
        };

        if (fs.existsSync(contractsPath)) {
            const existing = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            Object.assign(existing, addresses);
            fs.writeFileSync(contractsPath, JSON.stringify(existing, null, 2));
        } else {
            fs.writeFileSync(contractsPath, JSON.stringify(addresses, null, 2));
        }

        console.log(`\n✅ Contract addresses exported to frontend`);

        // 9. Display summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEPLOYMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Network: Sepolia Testnet`);
        console.log(`Chain ID: 11155111`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`\n📋 Deployed Contracts:`);
        console.log(`   LazyMintNFT:  ${lazyMint.address}`);
        console.log(`   Auction:      ${auction.address}`);
        console.log(`   Offer:        ${offer.address}`);
        console.log(`   Collection:   ${collection.address}`);
        console.log(`   Royalties:    ${royalties.address}`);
        console.log(`\n🔍 View on Etherscan: https://sepolia.etherscan.io/address/${deployer.address}`);
        console.log('='.repeat(60) + '\n');

        // 10. Verification instructions
        console.log('📝 Verification Instructions:');
        console.log(`\nTo verify contracts on Etherscan, run:`);
        console.log(`\nnpx hardhat verify --network sepolia ${lazyMint.address}`);
        console.log(`npx hardhat verify --network sepolia ${auction.address}`);
        console.log(`npx hardhat verify --network sepolia ${offer.address}`);
        console.log(`npx hardhat verify --network sepolia ${collection.address}`);
        console.log(`npx hardhat verify --network sepolia ${royalties.address}\n`);

        return deploymentInfo;
    } catch (err) {
        console.error('❌ Deployment failed:', err);
        throw err;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
