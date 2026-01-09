#!/usr/bin/env node

/**
 * Test NFT Fetching Across All Networks
 * This script verifies that the backend is returning NFTs from all networks
 */

import axios from 'axios';

const API_BASE_URL = 'http://durchex.com/api/v1'; // Change to localhost:5000 if testing locally
const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];

async function testNFTFetching() {
  console.log('\n🧪 Testing NFT Fetching Across Networks...\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Networks to test: ${networks.join(', ')}\n`);

  const results = {};
  let totalNFTs = 0;

  for (const network of networks) {
    try {
      console.log(`📡 Fetching NFTs from ${network}...`);
      const endpoint = `${API_BASE_URL}/nft/nfts/${network}`;
      
      const response = await axios.get(endpoint, {
        timeout: 10000,
      });

      const nfts = Array.isArray(response.data) ? response.data : [];
      const count = nfts.length;
      
      results[network] = {
        status: '✅ SUCCESS',
        count: count,
        endpoint: endpoint,
        sampleNFTs: nfts.slice(0, 2).map(nft => ({
          itemId: nft.itemId,
          name: nft.name,
          network: nft.network,
          currentlyListed: nft.currentlyListed,
        }))
      };

      console.log(`  ✅ Found ${count} NFTs on ${network}`);
      totalNFTs += count;

    } catch (error) {
      results[network] = {
        status: '❌ FAILED',
        error: error.message,
        endpoint: `${API_BASE_URL}/nft/nfts/${network}`,
      };
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  for (const [network, result] of Object.entries(results)) {
    console.log(`${network.toUpperCase()}: ${result.status}`);
    if (result.count !== undefined) {
      console.log(`  Count: ${result.count} NFTs`);
      if (result.sampleNFTs && result.sampleNFTs.length > 0) {
        console.log(`  Sample NFTs:`);
        result.sampleNFTs.forEach(nft => {
          console.log(`    - ${nft.name} (itemId: ${nft.itemId}, listed: ${nft.currentlyListed})`);
        });
      }
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log();
  }

  console.log(`📈 TOTAL NFTs ACROSS ALL NETWORKS: ${totalNFTs}`);
  
  // Check if all networks have data
  const networksWithData = Object.values(results).filter(r => r.count > 0).length;
  console.log(`✅ Networks with NFTs: ${networksWithData}/${networks.length}`);

  // Recommendations
  console.log('\n' + '='.repeat(60));
  if (totalNFTs === 0) {
    console.log('⚠️  NO NFTs FOUND - This might mean:');
    console.log('   1. No NFTs have been created yet');
    console.log('   2. Backend is not running');
    console.log('   3. API endpoint is incorrect');
    console.log('   4. Database is empty');
  } else if (networksWithData < networks.length) {
    console.log('⚠️  NFTs found but not on all networks:');
    const emptyNetworks = Object.entries(results)
      .filter(([_, r]) => r.count === 0)
      .map(([n, _]) => n);
    console.log(`   Missing data from: ${emptyNetworks.join(', ')}`);
  } else {
    console.log('✅ All networks have NFT data!');
  }
  console.log('='.repeat(60) + '\n');
}

// Run the test
testNFTFetching().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
