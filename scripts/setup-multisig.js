// Multi-signature wallet setup for governance
const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function setupMultiSig() {
  console.log('Setting up Multi-Signature Governance Wallet...\n');

  const [deployer] = await ethers.getSigners();

  // Multi-sig signers (should be community members)
  const signers = [
    process.env.MULTISIG_SIGNER_1,
    process.env.MULTISIG_SIGNER_2,
    process.env.MULTISIG_SIGNER_3,
    process.env.MULTISIG_SIGNER_4,
    process.env.MULTISIG_SIGNER_5,
  ].filter(Boolean);

  if (signers.length < 3) {
    throw new Error('Minimum 3 multi-sig signers required');
  }

  console.log(`Multi-Sig Signers (${signers.length} of 5):`);
  signers.forEach((signer, i) => {
    console.log(`  ${i + 1}. ${signer}`);
  });

  // Deployment parameters
  const requiredConfirmations = Math.ceil(signers.length / 2); // Majority required
  const dailyLimit = ethers.parseEther('100'); // 100 ETH daily limit

  console.log(`\n✓ Required confirmations: ${requiredConfirmations} of ${signers.length}`);
  console.log(`✓ Daily limit: ${ethers.formatEther(dailyLimit)} ETH`);

  try {
    // Deploy MultiSigWallet
    console.log('\nDeploying MultiSigWallet...');
    const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    const multiSig = await MultiSigWallet.deploy(signers, requiredConfirmations, dailyLimit);
    await multiSig.waitForDeployment();
    const multiSigAddress = await multiSig.getAddress();

    console.log(`✓ MultiSigWallet deployed: ${multiSigAddress}`);

    // Setup governance parameters
    const governanceConfig = {
      multisigAddress: multiSigAddress,
      signers,
      requiredConfirmations,
      dailyLimit: ethers.formatEther(dailyLimit),
      chainId: (await ethers.provider.getNetwork()).chainId,
      timestamp: new Date().toISOString(),
      signerNames: {
        [signers[0]]: 'Founder',
        [signers[1]]: 'Lead Developer',
        [signers[2]]: 'Treasury Lead',
        ...(signers[3] && { [signers[3]]: 'Community Manager' }),
        ...(signers[4] && { [signers[4]]: 'Security Lead' }),
      },
    };

    // Save configuration
    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentDir, 'multisig-config.json'),
      JSON.stringify(governanceConfig, null, 2)
    );

    console.log('\n✅ Multi-Sig Wallet setup complete!');
    console.log(`\nSave this address for contract ownership transfers:`);
    console.log(`   ${multiSigAddress}`);

    return multiSigAddress;
  } catch (error) {
    console.error('❌ Multi-Sig setup failed:', error.message);
    throw error;
  }
}

// Run setup
setupMultiSig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
