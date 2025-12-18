/**
 * Test Setup & Configuration
 * Initializes test environment, database, and sample data
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ==================== Configuration ====================

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

export const testConfig = {
  baseURL: BASE_URL,
  apiPrefix: API_PREFIX,
  timeout: 30000,
  networks: ['Polygon', 'Ethereum', 'BSC'],
  testWallets: {
    admin: '0x' + 'a'.repeat(40),
    user1: '0x' + 'b'.repeat(40),
    user2: '0x' + 'c'.repeat(40),
    user3: '0x' + 'd'.repeat(40),
  }
};

// ==================== API Client ====================

export const apiClient = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: testConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request/response interceptors for logging
apiClient.interceptors.request.use(
  config => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    console.log(`✅ Response: ${response.status}`);
    return response;
  },
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error(`❌ Error ${status}: ${message}`);
    return Promise.reject(error);
  }
);

// ==================== Sample Data ====================

export const sampleData = {
  users: [
    {
      walletAddress: testConfig.testWallets.user1,
      username: 'TestUser1',
      bio: 'First test user',
      profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      socialLinks: {
        twitter: 'https://twitter.com/testuser1',
        discord: 'https://discord.com/users/123456789'
      }
    },
    {
      walletAddress: testConfig.testWallets.user2,
      username: 'TestUser2',
      bio: 'Second test user',
      profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      socialLinks: {
        twitter: 'https://twitter.com/testuser2'
      }
    },
    {
      walletAddress: testConfig.testWallets.user3,
      username: 'TestUser3',
      bio: 'Third test user',
      profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      socialLinks: {}
    }
  ],

  collections: [
    {
      name: 'Summer 2025 Collection',
      description: 'Test collection for summer',
      symbol: 'SUM25',
      network: 'Polygon',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...'
    },
    {
      name: 'Digital Art Series',
      description: 'Test art collection',
      symbol: 'DART',
      network: 'Ethereum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...'
    }
  ],

  nfts: [
    {
      name: 'Test NFT #1',
      description: 'First test NFT',
      collection: 'Summer 2025 Collection',
      category: 'art',
      network: 'Polygon',
      price: '0.5',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      isGiveaway: false,
      eventStartTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    },
    {
      name: 'Test NFT #2',
      description: 'Second test NFT',
      collection: 'Digital Art Series',
      category: 'collectibles',
      network: 'Polygon',
      price: '1.0',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      isGiveaway: true,
      eventStartTime: new Date(Date.now() + 300000).toISOString() // 5 minutes from now
    },
    {
      name: 'Giveaway NFT #1',
      description: 'Giveaway test NFT',
      collection: 'Summer 2025 Collection',
      category: 'gaming',
      network: 'BSC',
      price: '0.1',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
      isGiveaway: true,
      eventStartTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago (event started)
      feeSubsidyPercentage: 50
    }
  ],

  cartItems: [
    {
      walletAddress: 'user1_wallet',
      nftId: 'nft_1',
      contractAddress: '0x1234567890123456789012345678901234567890',
      price: '0.5'
    }
  ]
};

// ==================== Utility Functions ====================

/**
 * Generate random wallet address (for testing)
 */
export const generateTestWallet = () => {
  return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Create API call with auth headers
 */
export const apiCallWithAuth = (authToken) => {
  const client = axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    timeout: testConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });

  return client;
};

/**
 * Create API call with admin headers
 */
export const apiCallWithAdminAuth = (adminId) => {
  const client = axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    timeout: testConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-id': adminId
    }
  });

  return client;
};

/**
 * Create API call with user wallet header
 */
export const apiCallWithUserWallet = (walletAddress) => {
  const client = axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    timeout: testConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'x-user-wallet': walletAddress
    }
  });

  return client;
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format test result
 */
export const formatResult = (testName, passed, message = '') => {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASSED' : 'FAILED';
  return `${icon} ${testName}: ${status} ${message ? `- ${message}` : ''}`;
};

/**
 * Assert utility
 */
export const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

/**
 * Assert equality
 */
export const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, but got ${actual}. ${message}`);
  }
};

/**
 * Assert object has property
 */
export const assertHasProperty = (obj, property, message) => {
  if (!obj.hasOwnProperty(property)) {
    throw new Error(`Expected object to have property '${property}'. ${message}`);
  }
};

// ==================== Exports ====================

export default {
  testConfig,
  apiClient,
  sampleData,
  generateTestWallet,
  apiCallWithAuth,
  apiCallWithAdminAuth,
  apiCallWithUserWallet,
  sleep,
  formatResult,
  assert,
  assertEqual,
  assertHasProperty
};
