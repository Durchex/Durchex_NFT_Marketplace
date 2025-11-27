#!/usr/bin/env node

/**
 * Tezos Mainnet Deployment Script
 * 
 * This script deploys the NFT Marketplace contract to Tezos mainnet.
 * 
 * Prerequisites:
 * - npm install @taquito/taquito @taquito/signer
 * - Set environment variables:
 *   - TEZOS_PRIVATE_KEY: Your Tezos private key (EdDSA secret key format)
 *   - TEZOS_RPC_URL: RPC endpoint (default: https://mainnet.api.tezos.com)
 * 
 * Usage:
 * NODE_ENV=production TEZOS_PRIVATE_KEY=<key> node scripts/deploy-tezos-mainnet.js
 */

import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import fs from "fs";
import path from "path";

// Configuration
const RPC_URL = process.env.TEZOS_RPC_URL || "https://mainnet.api.tezos.com";
const PRIVATE_KEY = process.env.TEZOS_PRIVATE_KEY;
const NETWORK = process.env.TEZOS_NETWORK || "mainnet";

// Validation
if (!PRIVATE_KEY) {
  console.error("❌ Error: TEZOS_PRIVATE_KEY environment variable is not set");
  console.error("Usage: TEZOS_PRIVATE_KEY=<key> npm run deploy:tezos:mainnet");
  process.exit(1);
}

// Minimal NFT Marketplace contract code (Michelson)
// This is a placeholder - replace with your actual contract code
const MARKETPLACE_CONTRACT_CODE = `
  {
    storage
      (pair
        (address %admin)
        (pair
          (nat %listings_count)
          (map %listings nat (pair (address %seller) (pair (nat %price) (bytes %metadata))))));
    parameter
      (or
        (or
          (pair %create_listing (nat %token_id) (pair (nat %price) (bytes %metadata)))
          (nat %cancel_listing))
        (or
          (nat %buy)
          (address %set_admin)));
    code
      {
        UNPAIR;
        IF_LEFT
          {
            IF_LEFT
              {
                DUP2;
                CAR;
                SENDER;
                COMPARE;
                EQ;
                NOT;
                ASSERT;
                DUP;
                GET 3;
                PUSH nat 1;
                DUP2;
                ADD;
                DUP3;
                GET 5;
                DIG 2;
                DIG 2;
                PAIR;
                DIG 2;
                DIG 2;
                SWAP;
                SOME;
                SWAP;
                UPDATE;
                PAIR;
                DIG 1;
                CDR;
                SWAP;
                PAIR;
                SWAP;
                CAR;
                PAIR;
              }
              {
                DUP2;
                GET 3;
                DUP1;
                DIG 2;
                NONE;
                SWAP;
                UPDATE;
                DUP3;
                GET 5;
                DIG 1;
                DIG 2;
                PAIR;
                DIG 3;
                CAR;
                PAIR;
                SWAP;
                CAR;
                PAIR;
              }
          }
          {
            IF_LEFT
              {
                DUP2;
                GET 3;
                DUP1;
                DIG 2;
                GET;
                IF_NONE
                  { PUSH string "NotFound"; FAILWITH }
                  {
                    DUP;
                    CAR;
                    PUSH nat 0;
                    PUSH mutez 0;
                    TRANSFER_TOKENS;
                    DUP1;
                    GET 3;
                    DIG 3;
                    CAR;
                    NIL operation;
                    DIG 2;
                    CONS;
                    SWAP;
                    PAIR;
                  };
              }
              {
                DUP2;
                CAR;
                SENDER;
                COMPARE;
                EQ;
                NOT;
                ASSERT;
                CAR;
                PAIR;
              }
          }
      }
  }
`;

async function deployMarketplace() {
  try {
    console.log(`\n🚀 Starting Tezos ${NETWORK} Marketplace Deployment`);
    console.log(`📡 RPC URL: ${RPC_URL}`);

    // Initialize Tezos Toolkit
    const Tezos = new TezosToolkit(RPC_URL);

    // Set up signer
    const signer = new InMemorySigner(PRIVATE_KEY);
    Tezos.setSignerProvider(signer);

    // Get deployer account
    const deployer = await signer.publicKeyHash();
    console.log(`\n📝 Deployer Address: ${deployer}`);

    // Get account balance
    const accountInfo = await Tezos.rpc.getBalance(deployer);
    const balanceInXTZ = accountInfo / 1000000; // Convert mutez to XTZ
    console.log(`💰 Account Balance: ${balanceInXTZ} XTZ`);

    if (balanceInXTZ < 1) {
      console.warn("⚠️  Warning: Account balance is less than 1 XTZ. Deployment might fail.");
    }

    // Deploy marketplace contract
    console.log("\n⏳ Originating Marketplace contract...");

    // Since we're using minimal code, we'll use a simplified deployment
    // In production, you'd load your actual compiled contract
    const contract = await Tezos.contract.originate({
      code: JSON.parse(MARKETPLACE_CONTRACT_CODE),
      storage: {
        admin: deployer,
        listings_count: 0,
        listings: {},
      },
      // Burn capacity in mutez (0.257 XTZ is a reasonable estimate)
      fee: 10000,
      storageLimit: 1000,
      gasLimit: 100000,
    });

    // Wait for confirmation
    await contract.confirmation(3); // Wait for 3 confirmations

    console.log(`\n✅ Marketplace Contract Deployment Successful!`);
    console.log(`📍 Contract Address: ${contract.address}`);
    console.log(`🔗 TzKT Explorer: https://tzkt.io/${contract.address}`);
    console.log(`⛽ Gas Used: ${contract.gas_limit}`);

    // Save deployment info to file
    const deploymentInfo = {
      network: NETWORK,
      rpcUrl: RPC_URL,
      deployer,
      marketplace: contract.address,
      deploymentTime: new Date().toISOString(),
      blockLevel: contract.level,
    };

    const deploymentPath = path.join(
      process.cwd(),
      "deployments",
      `tezos-${NETWORK}-deployment.json`
    );
    
    const deploymentDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

    // Output deployment commands for .env update
    console.log(`\n📋 Update your .env file with:`);
    console.log(`VITE_APP_TEZOS_MARKETPLACE_${NETWORK.toUpperCase()}=${contract.address}`);

    return contract.address;
  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);

    if (error.message.includes("Insufficient funds")) {
      console.error("\n💡 Tip: Ensure your account has at least 1 XTZ for deployment");
    }
    if (error.message.includes("Invalid key")) {
      console.error("\n💡 Tip: Check that TEZOS_PRIVATE_KEY is a valid EdDSA secret key");
    }

    process.exit(1);
  }
}

// Run deployment
deployMarketplace().then((address) => {
  console.log(`\n🎉 Marketplace ready at: ${address}`);
  process.exit(0);
});
