/**
 * scripts/verify-contracts.js
 * Verify deployed contracts on Etherscan
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Verify a contract on Etherscan
 */
async function verifyContract(contractAddress, contractName, constructorArgs = []) {
    console.log(`\n🔍 Verifying ${contractName}...`);

    try {
        await hre.run('verify:verify', {
            address: contractAddress,
            constructorArguments: constructorArgs,
        });

        console.log(`✅ ${contractName} verified on Etherscan!`);
        return true;
    } catch (err) {
        if (err.message.includes('Already Verified')) {
            console.log(`ℹ️  ${contractName} already verified`);
            return true;
        }

        console.error(`❌ Verification failed for ${contractName}:`, err.message);
        return false;
    }
}

/**
 * Load deployment addresses
 */
function loadDeploymentAddresses() {
    const deploymentsDir = path.join(__dirname, '../deployments/sepolia');
    const latestPath = path.join(deploymentsDir, 'latest.json');

    if (!fs.existsSync(latestPath)) {
        throw new Error('No deployment found. Run deploy-sepolia.js first');
    }

    const deployment = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    return deployment.contracts;
}

/**
 * Main verification process
 */
async function main() {
    console.log('🔐 Starting Contract Verification on Etherscan...\n');

    try {
        // Load deployment addresses
        const contracts = loadDeploymentAddresses();
        console.log('📋 Loaded deployment addresses from latest deployment\n');

        // Verify each contract
        const results = {};
        const contractsToVerify = [
            { name: 'LazyMintNFT', key: 'LazyMintNFT' },
            { name: 'Auction', key: 'Auction' },
            { name: 'Offer', key: 'Offer' },
            { name: 'Collection', key: 'Collection' },
            { name: 'Royalties', key: 'Royalties' },
        ];

        for (const contract of contractsToVerify) {
            if (!contracts[contract.key]) {
                console.log(`⚠️  ${contract.name} not found in deployment`);
                continue;
            }

            const success = await verifyContract(
                contracts[contract.key].address,
                contract.name
            );

            results[contract.key] = success;

            // Add delay between verifications to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(60));

        for (const [name, success] of Object.entries(results)) {
            const status = success ? '✅ Verified' : '❌ Failed';
            console.log(`${name}: ${status}`);
        }

        const allSuccess = Object.values(results).every((r) => r);
        console.log('='.repeat(60));

        if (allSuccess) {
            console.log('\n✅ All contracts verified successfully!');
            console.log('\n🔗 View on Etherscan:');
            for (const contract of contractsToVerify) {
                if (contracts[contract.key]) {
                    console.log(
                        `   ${contract.name}: https://sepolia.etherscan.io/address/${contracts[contract.key].address}`
                    );
                }
            }
        } else {
            console.log('\n⚠️  Some contracts failed verification. Try manually:');
            console.log('   npx hardhat verify --network sepolia <address> <constructor args>');
        }
    } catch (err) {
        console.error('❌ Verification process failed:', err.message);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
