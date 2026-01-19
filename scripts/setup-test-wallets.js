/**
 * scripts/setup-test-wallets.js
 * Generate and configure test wallets for Sepolia testnet
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const TEST_WALLETS_DIR = path.join(__dirname, '../config');

// Ensure config directory exists
if (!fs.existsSync(TEST_WALLETS_DIR)) {
    fs.mkdirSync(TEST_WALLETS_DIR, { recursive: true });
}

/**
 * Generate test wallets
 */
function generateTestWallets(count = 10) {
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const wallet = hre.ethers.Wallet.createRandom();
        wallets.push({
            index: i,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase || '',
            role: i === 0 ? 'admin' : i === 1 ? 'moderator' : 'user',
        });
    }

    return wallets;
}

/**
 * Get faucet URLs for test wallets
 */
function getFaucetInstructions(wallets) {
    return {
        sepolia: {
            faucetUrl: 'https://www.alchemy.com/faucets/ethereum-sepolia',
            instructions: `
To fund test wallets on Sepolia testnet:
1. Visit: https://www.alchemy.com/faucets/ethereum-sepolia
2. Connect your wallet
3. Enter each wallet address and claim 0.5 ETH

Alternative faucets:
- https://sepoliafaucet.com
- https://sepolia-faucet.pk910.de

After funding, test wallets are ready for deployment!
`,
            wallets: wallets.map((w) => ({
                address: w.address,
                role: w.role,
                fundingAmount: '0.5 ETH',
            })),
        },
    };
}

/**
 * Create test users data
 */
function generateTestUsers(wallets) {
    return wallets.map((wallet, index) => ({
        _id: `testuser_${index}`,
        address: wallet.address,
        email: `testuser${index}@durchex.test`,
        username: `TestUser${index}`,
        role: wallet.role,
        isVerified: index < 3, // First 3 users verified
        bio: `Test user ${index} for Durchex NFT Marketplace`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet.address}`,
        createdAt: new Date(),
        walletConnected: true,
    }));
}

/**
 * Create test NFTs
 */
function generateTestNFTs(wallets) {
    const collections = [
        { name: 'Pixel Art', description: 'Retro pixel art collection' },
        { name: '3D Generative', description: 'AI-generated 3D art' },
        { name: 'Photography', description: 'High-quality photography' },
    ];

    const nfts = [];
    let nftId = 1;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 10; j++) {
            nfts.push({
                _id: `testnft_${nftId}`,
                tokenId: nftId,
                name: `${collections[i].name} #${nftId}`,
                description: `Test NFT from ${collections[i].name} collection`,
                creator: wallets[0].address,
                owner: wallets[j % wallets.length].address,
                collectionId: `testcol_${i}`,
                collectionName: collections[i].name,
                imageUrl: `https://picsum.photos/400/400?random=${nftId}`,
                price: (Math.random() * 10).toFixed(2),
                rarity: ['common', 'uncommon', 'rare', 'epic'][Math.floor(Math.random() * 4)],
                attributes: [
                    { name: 'Type', value: collections[i].name },
                    { name: 'Color', value: ['Red', 'Blue', 'Green'][Math.floor(Math.random() * 3)] },
                ],
                status: 'listed',
                views: Math.floor(Math.random() * 1000),
                favorites: Math.floor(Math.random() * 100),
            });
            nftId++;
        }
    }

    return nfts;
}

/**
 * Create test collections
 */
function generateTestCollections() {
    return [
        {
            _id: 'testcol_0',
            name: 'Pixel Art',
            description: 'Retro pixel art collection',
            creator: 'testuser_0',
            verified: true,
            image: 'https://picsum.photos/600/400?random=1',
            contractAddress: '',
        },
        {
            _id: 'testcol_1',
            name: '3D Generative',
            description: 'AI-generated 3D art',
            creator: 'testuser_1',
            verified: true,
            image: 'https://picsum.photos/600/400?random=2',
            contractAddress: '',
        },
        {
            _id: 'testcol_2',
            name: 'Photography',
            description: 'High-quality photography',
            creator: 'testuser_2',
            verified: false,
            image: 'https://picsum.photos/600/400?random=3',
            contractAddress: '',
        },
    ];
}

/**
 * Main setup function
 */
async function main() {
    console.log('🧪 Setting up test environment for Sepolia...\n');

    // 1. Generate wallets
    console.log('1️⃣ Generating test wallets...');
    const wallets = generateTestWallets(10);
    console.log(`   ✓ Generated ${wallets.length} test wallets\n`);

    // 2. Get faucet information
    console.log('2️⃣ Faucet Instructions:');
    const faucetInfo = getFaucetInstructions(wallets);
    console.log(faucetInfo.sepolia.instructions);

    // 3. Generate test data
    console.log('3️⃣ Generating test data...');
    const testUsers = generateTestUsers(wallets);
    const testNFTs = generateTestNFTs(wallets);
    const testCollections = generateTestCollections();
    console.log(`   ✓ Generated ${testUsers.length} test users`);
    console.log(`   ✓ Generated ${testNFTs.length} test NFTs`);
    console.log(`   ✓ Generated ${testCollections.length} test collections\n`);

    // 4. Save configuration files
    console.log('4️⃣ Saving configuration files...');

    // Save wallets (SENSITIVE - handle carefully)
    const walletsPath = path.join(TEST_WALLETS_DIR, 'test-wallets.json');
    fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
    console.log(`   ✓ Test wallets saved (⚠️ KEEP SECRET)`);

    // Save faucet info
    const faucetPath = path.join(TEST_WALLETS_DIR, 'faucet-info.json');
    fs.writeFileSync(faucetPath, JSON.stringify(faucetInfo, null, 2));
    console.log(`   ✓ Faucet information saved`);

    // Save test seed data (for database)
    const seedDataPath = path.join(TEST_WALLETS_DIR, 'test-seed-data.json');
    fs.writeFileSync(seedDataPath, JSON.stringify({
        users: testUsers,
        collections: testCollections,
        nfts: testNFTs,
    }, null, 2));
    console.log(`   ✓ Seed data saved for database\n`);

    // 5. Create environment template
    console.log('5️⃣ Creating .env template...');
    const envTemplate = `
# Sepolia Testnet Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=${wallets[0].privateKey}
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# For other wallets, use:
${wallets.slice(1, 4).map((w, i) => `TEST_WALLET_${i + 2}_KEY=${w.privateKey}`).join('\n')}

# Gas settings
GAS_PRICE_GWEI=30
GAS_LIMIT=8000000

# Contract parameters
PLATFORM_FEE_PERCENTAGE=2.5
ROYALTY_MAX_PERCENTAGE=50
AUCTION_EXTENSION_MINUTES=15
`;

    const envPath = path.join(TEST_WALLETS_DIR, '.env.testnet.example');
    fs.writeFileSync(envPath, envTemplate);
    console.log(`   ✓ .env template created\n`);

    // 6. Generate setup summary
    console.log('6️⃣ Setup Summary:');
    console.log('='.repeat(60));
    console.log(`Network:        Sepolia Testnet`);
    console.log(`Chain ID:       11155111`);
    console.log(`Test Wallets:   ${wallets.length}`);
    console.log(`Admin Wallet:   ${wallets[0].address}`);
    console.log(`Test Users:     ${testUsers.length}`);
    console.log(`Test NFTs:      ${testNFTs.length}`);
    console.log(`Collections:    ${testCollections.length}`);
    console.log(`\n📁 Configuration Files:`);
    console.log(`   - ${path.relative(process.cwd(), walletsPath)}`);
    console.log(`   - ${path.relative(process.cwd(), faucetPath)}`);
    console.log(`   - ${path.relative(process.cwd(), seedDataPath)}`);
    console.log(`   - ${path.relative(process.cwd(), envPath)}`);
    console.log('='.repeat(60));

    console.log(`\n✅ Test environment setup complete!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Fund wallets using faucet URLs in ${path.relative(process.cwd(), faucetPath)}`);
    console.log(`   2. Update .env with your RPC and Etherscan API keys`);
    console.log(`   3. Run: npx hardhat run scripts/deploy-sepolia.js --network sepolia`);
    console.log(`   4. Import test seed data to your MongoDB database\n`);

    return {
        wallets,
        faucetInfo,
        testUsers,
        testNFTs,
        testCollections,
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
