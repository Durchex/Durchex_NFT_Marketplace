/**
 * Core Feature Tests
 * Tests for wallet, user, NFT, and cart functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  apiClient,
  apiCallWithUserWallet,
  sampleData,
  testConfig,
  generateTestWallet,
  formatResult,
  assertEqual,
  assertHasProperty
} from './setup.test.js';

let testResults = [];
let createdUserIds = [];
let createdNFTIds = [];

// ==================== User Tests ====================

describe('User Management - Core Features', () => {
  
  it('UT001: Should create user profile', async () => {
    const testName = 'User Creation';
    try {
      const userData = sampleData.users[0];
      const response = await apiClient.post('/user/users', userData);
      
      assertHasProperty(response.data, 'success', 'Response should have success property');
      assertHasProperty(response.data, 'user', 'Response should have user object');
      
      createdUserIds.push(userData.walletAddress);
      testResults.push(formatResult(testName, true, `User ${userData.username} created`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('UT002: Should retrieve user profile', async () => {
    const testName = 'User Profile Retrieval';
    try {
      const walletAddress = sampleData.users[0].walletAddress;
      const response = await apiClient.get(`/user/users/${walletAddress}`);
      
      assertHasProperty(response.data, 'user', 'Response should have user');
      assertEqual(response.data.user.walletAddress, walletAddress, 'Wallet address should match');
      
      testResults.push(formatResult(testName, true, `Retrieved ${walletAddress}`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('UT003: Should update user profile', async () => {
    const testName = 'User Profile Update';
    try {
      const walletAddress = sampleData.users[0].walletAddress;
      const updateData = {
        bio: 'Updated bio for testing',
        username: 'TestUser1Updated'
      };
      
      const response = await apiClient.put(`/user/users/${walletAddress}`, updateData);
      assertHasProperty(response.data, 'success', 'Response should have success property');
      
      testResults.push(formatResult(testName, true, 'Profile updated'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('UT004: Should get all users', async () => {
    const testName = 'Get All Users';
    try {
      const response = await apiClient.get('/user/users');
      
      assertHasProperty(response.data, 'users', 'Response should have users array');
      expect(Array.isArray(response.data.users)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.users.length} users`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== NFT Creation Tests ====================

describe('NFT Management - Core Features', () => {
  
  it('NT001: Should create unminted NFT (admin)', async () => {
    const testName = 'Unminted NFT Creation';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const nftData = {
        ...sampleData.nfts[0],
        collection: sampleData.collections[0].name
      };
      
      const response = await adminClient.post('/admin/nfts/unminted/create', nftData);
      assertHasProperty(response.data, 'nft', 'Response should have NFT object');
      
      createdNFTIds.push(response.data.nft._id);
      testResults.push(formatResult(testName, true, `NFT ${nftData.name} created`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('NT002: Should retrieve unminted NFTs list', async () => {
    const testName = 'Get Unminted NFTs';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/nfts/unminted/list');
      
      assertHasProperty(response.data, 'nfts', 'Response should have NFTs array');
      expect(Array.isArray(response.data.nfts)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.nfts.length} NFTs`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('NT003: Should mark NFT as minted', async () => {
    const testName = 'Mark NFT as Minted';
    try {
      if (createdNFTIds.length === 0) {
        throw new Error('No NFT created to test minting');
      }

      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const nftId = createdNFTIds[0];
      const mintData = {
        tokenId: '1001',
        transactionHash: '0x' + 'a'.repeat(64),
        blockNumber: 12345
      };
      
      const response = await adminClient.patch(`/admin/nfts/${nftId}`, mintData);
      assertHasProperty(response.data, 'success', 'Response should have success property');
      
      testResults.push(formatResult(testName, true, 'NFT marked as minted'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('NT004: Should filter NFTs by network', async () => {
    const testName = 'Filter NFTs by Network';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/nfts/unminted/list?network=Polygon');
      
      assertHasProperty(response.data, 'nfts', 'Response should have NFTs array');
      
      // All returned NFTs should be on Polygon network
      if (response.data.nfts.length > 0) {
        response.data.nfts.forEach(nft => {
          assertEqual(nft.network, 'Polygon', 'All NFTs should be on Polygon');
        });
      }
      
      testResults.push(formatResult(testName, true, 'Filtered by network'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Shopping Cart Tests ====================

describe('Shopping Cart - Core Features', () => {
  
  it('CT001: Should add NFT to cart', async () => {
    const testName = 'Add to Cart';
    try {
      const userWallet = sampleData.users[0].walletAddress;
      const userClient = apiCallWithUserWallet(userWallet);
      
      const cartItem = {
        nftId: 'test_nft_1',
        contractAddress: '0x' + '1'.repeat(40),
        price: '0.5',
        walletAddress: userWallet
      };
      
      const response = await userClient.post('/cart/', cartItem);
      assertHasProperty(response.data, 'success', 'Response should have success property');
      
      testResults.push(formatResult(testName, true, 'Item added to cart'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('CT002: Should retrieve user cart', async () => {
    const testName = 'Get User Cart';
    try {
      const userWallet = sampleData.users[0].walletAddress;
      const userClient = apiCallWithUserWallet(userWallet);
      
      const response = await userClient.get(`/cart/cart/${userWallet}`);
      assertHasProperty(response.data, 'cart', 'Response should have cart object');
      
      testResults.push(formatResult(testName, true, `Retrieved cart with items`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('CT003: Should remove NFT from cart', async () => {
    const testName = 'Remove from Cart';
    try {
      const userWallet = sampleData.users[0].walletAddress;
      const userClient = apiCallWithUserWallet(userWallet);
      
      const response = await userClient.delete(
        `/cart/cart/${userWallet}/test_nft_1/0x${'1'.repeat(40)}`
      );
      assertHasProperty(response.data, 'success', 'Response should have success property');
      
      testResults.push(formatResult(testName, true, 'Item removed from cart'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('CT004: Should clear entire cart', async () => {
    const testName = 'Clear Cart';
    try {
      const userWallet = sampleData.users[0].walletAddress;
      const userClient = apiCallWithUserWallet(userWallet);
      
      const response = await userClient.delete(`/cart/cart/${userWallet}`);
      assertHasProperty(response.data, 'success', 'Response should have success property');
      
      testResults.push(formatResult(testName, true, 'Cart cleared'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Test Report ====================

afterAll(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CORE FEATURES TEST REPORT');
  console.log('='.repeat(60));
  testResults.forEach(result => console.log(result));
  console.log('='.repeat(60));
  console.log(`✅ Total: ${testResults.length} | Passed: ${testResults.filter(r => r.includes('✅')).length}`);
  console.log('='.repeat(60) + '\n');
});

export { testResults };
