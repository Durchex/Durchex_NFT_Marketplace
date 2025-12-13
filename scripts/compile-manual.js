#!/usr/bin/env node

/**
 * Simple Contract Compiler
 * Compiles contracts using solc directly
 */

const solc = require('solc');
const fs = require('fs');
const path = require('path');

function compileContract(contractName, contractPath) {
  console.log(`Compiling ${contractName}...`);

  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [contractName + '.sol']: {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    console.error('Compilation errors:', output.errors);
    return null;
  }

  return output.contracts[contractName + '.sol'][contractName];
}

function saveArtifact(contractName, compiledContract) {
  const artifactDir = path.join(__dirname, '..', 'artifacts', 'contracts', contractName + '.sol');
  const artifactPath = path.join(artifactDir, contractName + '.json');

  const artifact = {
    contractName: contractName,
    abi: compiledContract.abi,
    bytecode: compiledContract.evm.bytecode.object,
    deployedBytecode: compiledContract.evm.deployedBytecode.object,
    linkReferences: {},
    deployedLinkReferences: {}
  };

  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(`Saved artifact: ${artifactPath}`);
}

async function main() {
  console.log('🚀 Starting manual contract compilation...');

  try {
    // Compile VendorNFT
    const vendorNFTContract = compileContract('VendorNFT', path.join(__dirname, '..', 'contracts', 'VendorNFT.sol'));
    if (vendorNFTContract) {
      saveArtifact('VendorNFT', vendorNFTContract);
    }

    // Compile NFTMarketplace
    const marketplaceContract = compileContract('NFTMarketplace', path.join(__dirname, '..', 'contracts', 'NFTMarketplace.sol'));
    if (marketplaceContract) {
      saveArtifact('NFTMarketplace', marketplaceContract);
    }

    console.log('✅ Compilation completed!');
  } catch (error) {
    console.error('❌ Compilation failed:', error);
  }
}

main();