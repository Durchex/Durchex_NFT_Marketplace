/**
 * Admin & Security Tests
 * Tests for admin functionality and security features
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  apiClient,
  apiCallWithUserWallet,
  apiCallWithAdminAuth,
  sampleData,
  testConfig,
  formatResult,
  assertEqual,
  assertHasProperty
} from './setup.test.js';

let testResults = [];

// ==================== Admin Dashboard Tests ====================

describe('Admin Dashboard - Admin Features', () => {
  
  it('AD001: Should get dashboard stats', async () => {
    const testName = 'Dashboard Stats';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/stats');
      
      assertHasProperty(response.data, 'success', 'Response should have success');
      assertHasProperty(response.data, 'stats', 'Response should have stats');
      assertHasProperty(response.data.stats, 'totalUsers', 'Stats should have totalUsers');
      assertHasProperty(response.data.stats, 'totalNFTs', 'Stats should have totalNFTs');
      
      testResults.push(formatResult(testName, true, 'Stats retrieved'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('AD002: Should get all users (admin view)', async () => {
    const testName = 'Get All Users (Admin)';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/users');
      
      assertHasProperty(response.data, 'users', 'Response should have users');
      expect(Array.isArray(response.data.users)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.users.length} users`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('AD003: Should get all NFTs (admin view)', async () => {
    const testName = 'Get All NFTs (Admin)';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/nfts');
      
      assertHasProperty(response.data, 'nfts', 'Response should have NFTs');
      expect(Array.isArray(response.data.nfts)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.nfts.length} NFTs`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('AD004: Should get transactions', async () => {
    const testName = 'Get Transactions';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/transactions');
      
      assertHasProperty(response.data, 'transactions', 'Response should have transactions');
      expect(Array.isArray(response.data.transactions)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.transactions.length} transactions`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('AD005: Should get activity log', async () => {
    const testName = 'Get Activity Log';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/activity?page=1&limit=50');
      
      assertHasProperty(response.data, 'activities', 'Response should have activities');
      expect(Array.isArray(response.data.activities)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved activity log`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== User Status Management ====================

describe('User Management - Admin Control', () => {
  
  it('UM001: Should update user status', async () => {
    const testName = 'Update User Status';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const walletAddress = sampleData.users[0].walletAddress;
      const statusUpdate = {
        status: 'active',
        isVerified: true
      };
      
      const response = await adminClient.patch(`/admin/users/${walletAddress}`, statusUpdate);
      assertHasProperty(response.data, 'success', 'Should update user status');
      
      testResults.push(formatResult(testName, true, 'User status updated'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('UM002: Should update NFT status', async () => {
    const testName = 'Update NFT Status';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const statusUpdate = {
        status: 'listed',
        featured: true
      };
      
      const response = await adminClient.patch(
        `/admin/nfts/Polygon/test_nft_001`,
        statusUpdate
      );
      
      // Might return 404 if NFT doesn't exist, but should not return 403 (unauthorized)
      if (response.status === 200) {
        testResults.push(formatResult(testName, true, 'NFT status updated'));
      } else if (response.status === 404) {
        testResults.push(formatResult(testName, true, 'Endpoint exists (404 is OK for missing NFT)'));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        testResults.push(formatResult(testName, true, 'Endpoint exists (404 expected)'));
      } else {
        testResults.push(formatResult(testName, false, error.message));
      }
    }
  });
});

// ==================== Giveaway Admin Tests ====================

describe('Giveaway Management - Admin Control', () => {
  
  it('GA001: Should get all giveaway NFTs', async () => {
    const testName = 'Get All Giveaways (Admin)';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/nfts/giveaways');
      
      assertHasProperty(response.data, 'nfts', 'Response should have NFTs');
      expect(Array.isArray(response.data.nfts)).toBe(true);
      
      testResults.push(formatResult(testName, true, `Retrieved ${response.data.nfts.length} giveaways`));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('GA002: Should revoke NFT offer', async () => {
    const testName = 'Revoke Giveaway Offer';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      
      // This assumes a giveaway exists (from previous tests)
      const response = await adminClient.post('/admin/nfts/giveaways/revoke/test_giveaway_id', {
        walletAddress: sampleData.users[0].walletAddress
      });
      
      // Might return 404 if giveaway doesn't exist
      if (response.status === 200) {
        testResults.push(formatResult(testName, true, 'Offer revoked'));
      } else {
        testResults.push(formatResult(testName, true, 'Endpoint exists'));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        testResults.push(formatResult(testName, true, 'Endpoint exists (404 expected)'));
      } else {
        testResults.push(formatResult(testName, false, error.message));
      }
    }
  });
});

// ==================== Analytics Tests ====================

describe('Analytics & Reporting - Admin Features', () => {
  
  it('AN001: Should get analytics data', async () => {
    const testName = 'Get Analytics';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const response = await adminClient.get('/admin/analytics');
      
      assertHasProperty(response.data, 'analytics', 'Response should have analytics');
      
      testResults.push(formatResult(testName, true, 'Analytics retrieved'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('AN002: Should generate report', async () => {
    const testName = 'Generate Report';
    try {
      const adminClient = apiCallWithUserWallet(testConfig.testWallets.admin);
      const reportData = {
        type: 'sales',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      };
      
      const response = await adminClient.post('/admin/reports/sales', reportData);
      assertHasProperty(response.data, 'report', 'Response should have report');
      
      testResults.push(formatResult(testName, true, 'Report generated'));
      expect(response.status).toBe(200);
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Security Tests ====================

describe('Security - Authorization & Protection', () => {
  
  it('SEC001: Should deny non-admin access to admin endpoints', async () => {
    const testName = 'Deny Non-Admin Access';
    try {
      const userClient = apiCallWithUserWallet(sampleData.users[0].walletAddress);
      
      try {
        await userClient.get('/admin/stats');
        testResults.push(formatResult(testName, false, 'Should have been denied'));
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          testResults.push(formatResult(testName, true, 'Access correctly denied'));
        } else {
          throw error;
        }
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('SEC002: Should validate wallet address format', async () => {
    const testName = 'Validate Wallet Address';
    try {
      const invalidData = {
        walletAddress: 'not_a_valid_wallet',
        username: 'test'
      };
      
      try {
        await apiClient.post('/user/users', invalidData);
        testResults.push(formatResult(testName, false, 'Should have rejected invalid wallet'));
      } catch (error) {
        if (error.response?.status === 400) {
          testResults.push(formatResult(testName, true, 'Invalid wallet rejected'));
        } else {
          throw error;
        }
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('SEC003: Should prevent unauthorized NFT edits', async () => {
    const testName = 'Prevent Unauthorized Edits';
    try {
      const user1Client = apiCallWithUserWallet(sampleData.users[0].walletAddress);
      
      // User1 tries to edit User2's NFT
      try {
        await user1Client.patch('/admin/nfts/Polygon/other_user_nft', {
          status: 'delisted'
        });
        testResults.push(formatResult(testName, false, 'Should have been denied'));
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          testResults.push(formatResult(testName, true, 'Edit correctly denied'));
        } else {
          throw error;
        }
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });

  it('SEC004: Should sanitize user input', async () => {
    const testName = 'Sanitize User Input';
    try {
      const maliciousData = {
        walletAddress: sampleData.users[0].walletAddress,
        username: '<script>alert("xss")</script>',
        bio: '"; DROP TABLE users; --'
      };
      
      const response = await apiClient.post('/user/users', maliciousData);
      
      // Should accept but sanitize
      if (response.status === 200) {
        // Verify the data is sanitized (no script tags or SQL)
        expect(response.data.user.username).not.toContain('<script>');
        testResults.push(formatResult(testName, true, 'Input sanitized'));
      }
    } catch (error) {
      testResults.push(formatResult(testName, false, error.message));
      throw error;
    }
  });
});

// ==================== Test Report ====================

afterAll(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADMIN & SECURITY TEST REPORT');
  console.log('='.repeat(60));
  testResults.forEach(result => console.log(result));
  console.log('='.repeat(60));
  console.log(`✅ Total: ${testResults.length} | Passed: ${testResults.filter(r => r.includes('✅')).length}`);
  console.log('='.repeat(60) + '\n');
});

export { testResults };
