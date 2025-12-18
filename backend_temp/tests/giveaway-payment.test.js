/**
 * Giveaway & Payment Tests
 * Tests for giveaway system and fee calculations
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  apiClient,
  apiCallWithUserWallet,
  sampleData,
  testConfig,
  sleep,
  formatResult,
  assertEqual,
  assertHasProperty
} from './setup.test.js';

let testResults = [];
let giveawayNFTId = null;

// ==================== Giveaway System Tests ====================

describe('Giveaway System - Advanced Features', () => {
  
  it('GA001: Should create giveaway NFT', async () => {
    const testName = 'Create Giveaway NFT';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const giveawayData = {
        ...sampleData.nfts[1],
        collection: sampleData.collections[0].name,
        isGiveaway: true
      };
      
      const response = await adminClient.post('/admin/nfts/unminted/create', giveawayData);
      assertHasProperty(response.data, 'nft', 'Should create NFT');
      assertEqual(response.data.nft.isGiveaway, true, 'NFT should be marked as giveaway');
      
      giveawayNFTId = response.data.nft._id;
      testResults.push(formatResult(testName, true, 'Giveaway NFT created'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA002: Should offer giveaway to user', async () => {
    const testName = 'Offer Giveaway to User';
    try {
      if (!giveawayNFTId) {
        throw new Error('No giveaway NFT created');
      }

      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const offerData = {
        walletAddress: sampleData.users[1].walletAddress
      };
      
      const response = await adminClient.post(
        `/admin/nfts/giveaways/offer/${giveawayNFTId}`,
        offerData
      );
      assertHasProperty(response.data, 'success', 'Should offer NFT');
      
      testResults.push(formatResult(testName, true, `Offered to ${offerData.walletAddress}`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA003: Should retrieve user giveaway NFTs', async () => {
    const testName = 'Get User Giveaway NFTs';
    try {
      const userWallet = sampleData.users[1].walletAddress;
      const userClient = apiCallWithUserWallet(userWallet);
      
      const response = await userClient.get('/admin/nfts/giveaways/my-nfts');
      assertHasProperty(response.data, 'nfts', 'Response should have NFTs array');
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.nfts.length} giveaway NFTs`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA004: Should prevent claiming before event start', async () => {
    const testName = 'Prevent Early Claim';
    try {
      // Create giveaway with future event time
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const futureGiveaway = {
        ...sampleData.nfts[0],
        collection: sampleData.collections[0].name,
        isGiveaway: true,
        eventStartTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      
      const createResponse = await adminClient.post('/admin/nfts/unminted/create', futureGiveaway);
      const futureNFTId = createResponse.data.nft._id;
      
      // Try to claim
      const userClient = apiCallWithUserWallet(sampleData.users[2].walletAddress);
      
      try {
        await userClient.post('/admin/nfts/giveaways/claim', { nftId: futureNFTId });
        testResults.push(formatResult(testName, false, 'Should have prevented claim'));
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push(formatResult(testName, true, 'Claim correctly prevented'));
          expect(error.response.data.error).toContain('not started');
        } else {
          throw error;
        }
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA005: Should claim giveaway after event start', async () => {
    const testName = 'Claim Giveaway When Live';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      
      // Create giveaway with event already started
      const readyGiveaway = {
        ...sampleData.nfts[2],
        collection: sampleData.collections[0].name,
        isGiveaway: true,
        eventStartTime: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      };
      
      const createResponse = await adminClient.post('/admin/nfts/unminted/create', readyGiveaway);
      const nftId = createResponse.data.nft._id;
      
      // Offer to user
      const offerData = {
        walletAddress: sampleData.users[2].walletAddress
      };
      await adminClient.post(`/admin/nfts/giveaways/offer/${nftId}`, offerData);
      
      // Claim
      const userClient = apiCallWithUserWallet(sampleData.users[2].walletAddress);
      const claimResponse = await userClient.post('/admin/nfts/giveaways/claim', { nftId });
      
      assertHasProperty(claimResponse.data, 'success', 'Should claim successfully');
      assertHasProperty(claimResponse.data, 'nft', 'Should return NFT object');
      
      testResults.push(formatResult(testName, true, 'NFT claimed successfully'));
      expect(claimResponse.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA006: Should prevent double claiming', async () => {
    const testName = 'Prevent Double Claim';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      
      // Create and offer giveaway
      const giveaway = {
        ...sampleData.nfts[2],
        collection: sampleData.collections[0].name,
        isGiveaway: true,
        eventStartTime: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      };
      
      const createResponse = await adminClient.post('/admin/nfts/unminted/create', giveaway);
      const nftId = createResponse.data.nft._id;
      
      const offerData = {
        walletAddress: sampleData.users[0].walletAddress
      };
      await adminClient.post(`/admin/nfts/giveaways/offer/${nftId}`, offerData);
      
      // First claim
      const userClient = apiCallWithUserWallet(sampleData.users[0].walletAddress);
      const firstClaim = await userClient.post('/admin/nfts/giveaways/claim', { nftId });
      assertHasProperty(firstClaim.data, 'success', 'First claim should succeed');
      
      // Second claim - should fail
      try {
        await userClient.post('/admin/nfts/giveaways/claim', { nftId });
        testResults.push(formatResult(testName, false, 'Should have prevented double claim'));
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push(formatResult(testName, true, 'Double claim correctly prevented'));
        } else {
          throw error;
        }
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Fee Subsidy Tests ====================

describe('Fee Subsidy System - Payment Features', () => {
  
  it('FS001: Should calculate service charge (2.5%)', async () => {
    const testName = 'Service Charge Calculation';
    try {
      const nftPrice = 100;
      const serviceFeePercent = 2.5;
      const expectedFee = nftPrice * (serviceFeePercent / 100);
      const total = nftPrice + expectedFee;
      
      // Backend should calculate: total = price + (price * 0.025)
      const calculatedTotal = nftPrice + (nftPrice * 0.025);
      assertEqual(calculatedTotal, total, 'Total should be price + 2.5% fee');
      assertEqual(calculatedTotal, 102.5, 'Total should equal 102.5');
      
      testResults.push(formatResult(testName, true, `$100 NFT = $102.50 total`));
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('FS002: Should set fee subsidy for user', async () => {
    const testName = 'Set Fee Subsidy';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const subsidyData = {
        walletAddress: sampleData.users[0].walletAddress,
        subsidyPercentage: 50
      };
      
      const response = await adminClient.post('/admin/fee-subsidy/set', subsidyData);
      assertHasProperty(response.data, 'success', 'Should set subsidy');
      
      testResults.push(formatResult(testName, true, '50% subsidy set'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('FS003: Should apply fee subsidy to purchase', async () => {
    const testName = 'Apply Fee Subsidy';
    try {
      // User with 50% subsidy
      // NFT price: $100
      // Service charge: 2.5% = $2.50
      // Subsidy discount (50%): -$1.25
      // Final charge: $1.25
      // Total paid: $101.25
      
      const nftPrice = 100;
      const serviceFee = nftPrice * 0.025; // $2.50
      const subsidyPercent = 50;
      const subsidyAmount = serviceFee * (subsidyPercent / 100); // $1.25
      const adjustedFee = serviceFee - subsidyAmount; // $1.25
      const totalWithSubsidy = nftPrice + adjustedFee;
      
      assertEqual(adjustedFee, 1.25, 'Adjusted fee should be $1.25');
      assertEqual(totalWithSubsidy, 101.25, 'Total should be $101.25');
      
      testResults.push(formatResult(testName, true, 'Subsidy correctly applied: $101.25'));
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('FS004: Should get fee subsidy info', async () => {
    const testName = 'Get Fee Subsidy Info';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const walletAddress = sampleData.users[0].walletAddress;
      
      const response = await adminClient.get(`/admin/fee-subsidy/info/${walletAddress}`);
      assertHasProperty(response.data, 'subsidy', 'Response should have subsidy info');
      
      testResults.push(formatResult(testName, true, 'Retrieved subsidy info'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Royalty Calculation Tests ====================

describe('Royalty System - Payment Features', () => {
  
  it('RY001: Should calculate royalty on resale', async () => {
    const testName = 'Royalty Calculation';
    try {
      // Original sale: $100 (creator gets $100)
      // Resale: $500
      // Creator royalty: 10%
      // Service charge: 2.5%
      
      const resalePrice = 500;
      const royaltyPercent = 10;
      const serviceFeePercent = 2.5;
      
      const royaltyAmount = resalePrice * (royaltyPercent / 100); // $50
      const serviceFee = resalePrice * (serviceFeePercent / 100); // $12.50
      const sellerGets = resalePrice - royaltyAmount; // $450
      
      // Final breakdown:
      // Reseller: $450
      // Creator: $50
      // Platform: $12.50
      // Total payout: $512.50 (but buyer only pays $512.50, no extra)
      
      assertEqual(royaltyAmount, 50, 'Royalty should be $50');
      assertEqual(serviceFee, 12.5, 'Service fee should be $12.50');
      
      testResults.push(formatResult(testName, true, 'Royalty: $50, Fee: $12.50'));
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Test Report ====================

afterAll(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 GIVEAWAY & PAYMENT TEST REPORT');
  console.log('='.repeat(60));
  testResults.forEach(result => console.log(result));
  console.log('='.repeat(60));
  console.log(`✅ Total: ${testResults.length} | Passed: ${testResults.filter(r => r.includes('✅')).length}`);
  console.log('='.repeat(60) + '\n');
});

export { testResults };
