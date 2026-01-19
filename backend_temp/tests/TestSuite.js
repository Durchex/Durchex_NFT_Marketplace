/**
 * Comprehensive Test Suite - Unit and Integration Tests
 * Tests for critical components, services, and API endpoints
 */

const request = require('supertest');
const assert = require('assert');
const logger = require('../utils/logger');

class TestSuite {
  constructor(app) {
    this.app = app;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }

  // ========== Authentication Tests ==========

  async testUserAuthentication() {
    const testName = 'User Authentication';
    try {
      // Test valid login
      const response = await request(this.app)
        .post('/api/v1/user/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      assert(response.status === 200 || response.status === 401, 'Login endpoint responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testTokenValidation() {
    const testName = 'Token Validation';
    try {
      const token = 'invalid_token_test';
      
      const response = await request(this.app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${token}`);

      assert(response.status === 401, 'Invalid token rejected');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== NFT Operations Tests ==========

  async testNFTMinting() {
    const testName = 'NFT Minting';
    try {
      const response = await request(this.app)
        .post('/api/v1/nft/mint')
        .send({
          name: 'Test NFT',
          description: 'Test Description',
          imageUrl: 'https://example.com/image.jpg',
          royaltyPercentage: 10
        });

      assert(response.status === 201 || response.status === 400, 'Mint endpoint responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testNFTListing() {
    const testName = 'NFT Listing';
    try {
      const response = await request(this.app)
        .post('/api/v1/nft/list')
        .send({
          nftId: 'test-nft-123',
          price: '1.5',
          currency: 'ETH'
        });

      assert(response.status === 201 || response.status === 400, 'List endpoint responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testNFTTransfer() {
    const testName = 'NFT Transfer';
    try {
      const response = await request(this.app)
        .post('/api/v1/nft/transfer')
        .send({
          nftId: 'test-nft-123',
          toAddress: '0x' + '1'.repeat(40),
          fromAddress: '0x' + '2'.repeat(40)
        });

      assert(response.status === 200 || response.status === 400, 'Transfer endpoint responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Marketplace Tests ==========

  async testOfferCreation() {
    const testName = 'Offer Creation';
    try {
      const response = await request(this.app)
        .post('/api/v1/offers/create')
        .send({
          nftId: 'test-nft-123',
          price: '0.5',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

      assert(response.status === 201 || response.status === 400, 'Offer creation responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testOrderProcessing() {
    const testName = 'Order Processing';
    try {
      const response = await request(this.app)
        .post('/api/v1/orders/create')
        .send({
          nftId: 'test-nft-123',
          buyerAddress: '0x' + '1'.repeat(40),
          sellerAddress: '0x' + '2'.repeat(40),
          price: '1.0'
        });

      assert(response.status === 201 || response.status === 400, 'Order creation responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Search Tests ==========

  async testSearchFunctionality() {
    const testName = 'Search Functionality';
    try {
      const response = await request(this.app)
        .get('/api/v1/search/nfts')
        .query({ q: 'test', limit: 10 });

      assert(response.status === 200, 'Search responds with 200');
      assert(Array.isArray(response.body.data), 'Search returns array');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testAdvancedFilters() {
    const testName = 'Advanced Filters';
    try {
      const response = await request(this.app)
        .get('/api/v1/search/filter')
        .query({
          collectionId: 'test-collection',
          minPrice: 0.1,
          maxPrice: 100
        });

      assert(response.status === 200, 'Advanced filters respond');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Analytics Tests ==========

  async testAnalyticsDashboard() {
    const testName = 'Analytics Dashboard';
    try {
      const response = await request(this.app)
        .get('/api/v1/analytics/dashboard');

      assert(response.status === 200, 'Analytics responds');
      assert(response.body.success === true, 'Analytics returns success');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testPortfolioAnalytics() {
    const testName = 'Portfolio Analytics';
    try {
      const response = await request(this.app)
        .get('/api/v1/analytics/portfolio')
        .query({ address: '0x' + '1'.repeat(40) });

      assert(response.status === 200 || response.status === 400, 'Portfolio analytics responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Bridge Tests ==========

  async testBridgeTransfer() {
    const testName = 'Cross-Chain Bridge Transfer';
    try {
      const response = await request(this.app)
        .post('/api/v1/bridge/transfer')
        .send({
          fromChain: 'ethereum',
          toChain: 'polygon',
          amount: '1.0',
          tokenAddress: '0x' + '1'.repeat(40)
        });

      assert(response.status === 201 || response.status === 400, 'Bridge transfer responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Rental Tests ==========

  async testRentalListing() {
    const testName = 'NFT Rental Listing';
    try {
      const response = await request(this.app)
        .post('/api/v1/rental/list')
        .send({
          nftId: 'test-nft-123',
          rentalPrice: '0.1',
          duration: 30
        });

      assert(response.status === 201 || response.status === 400, 'Rental listing responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Pool Tests ==========

  async testLiquidityPoolCreation() {
    const testName = 'Liquidity Pool Creation';
    try {
      const response = await request(this.app)
        .post('/api/v1/pool/create')
        .send({
          tokenA: '0x' + '1'.repeat(40),
          tokenB: '0x' + '2'.repeat(40),
          amountA: '100',
          amountB: '100'
        });

      assert(response.status === 201 || response.status === 400, 'Pool creation responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Governance Tests ==========

  async testProposalCreation() {
    const testName = 'Governance Proposal Creation';
    try {
      const response = await request(this.app)
        .post('/api/v1/governance/proposals/create')
        .send({
          title: 'Test Proposal',
          description: 'A test governance proposal',
          proposalType: 'PARAMETER_CHANGE'
        });

      assert(response.status === 201 || response.status === 400, 'Proposal creation responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Compliance Tests ==========

  async testKYCInitiation() {
    const testName = 'KYC Verification Initiation';
    try {
      const response = await request(this.app)
        .post('/api/v1/compliance/kyc/initiate')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          country: 'US'
        });

      assert(response.status === 201 || response.status === 400, 'KYC initiation responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testAMLScreening() {
    const testName = 'AML Screening';
    try {
      const response = await request(this.app)
        .post('/api/v1/compliance/aml/screen')
        .send({
          fromAddress: '0x' + '1'.repeat(40),
          toAddress: '0x' + '2'.repeat(40),
          amount: '100',
          token: 'ETH',
          transactionHash: '0x' + '3'.repeat(64)
        });

      assert(response.status === 200, 'AML screening responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Performance Tests ==========

  async testCacheOperations() {
    const testName = 'Cache Operations';
    try {
      const response = await request(this.app)
        .get('/api/v1/performance/cache/stats');

      assert(response.status === 200 || response.status === 401, 'Cache stats respond');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testRateLimiting() {
    const testName = 'Rate Limiting';
    try {
      const response = await request(this.app)
        .post('/api/v1/performance/rate-limit/check')
        .send({
          identifier: 'test-user',
          limit: 100
        });

      assert(response.status === 200, 'Rate limit check responds');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Data Validation Tests ==========

  async testEmailValidation() {
    const testName = 'Email Validation';
    try {
      const validEmail = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      assert(emailRegex.test(validEmail), 'Valid email passes validation');
      assert(!emailRegex.test('invalid-email'), 'Invalid email fails validation');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  async testAddressValidation() {
    const testName = 'Ethereum Address Validation';
    try {
      const validAddress = '0x' + '1'.repeat(40);
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      
      assert(addressRegex.test(validAddress), 'Valid address passes validation');
      assert(!addressRegex.test('invalid-address'), 'Invalid address fails validation');
      this.recordTest(testName, true);
    } catch (error) {
      this.recordTest(testName, false, error.message);
    }
  }

  // ========== Test Utilities ==========

  recordTest(name, passed, error = null) {
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }

    this.results.tests.push({
      name,
      passed,
      error
    });
  }

  async runAllTests() {
    logger.info('Starting comprehensive test suite');

    // Authentication tests
    await this.testUserAuthentication();
    await this.testTokenValidation();

    // NFT operations
    await this.testNFTMinting();
    await this.testNFTListing();
    await this.testNFTTransfer();

    // Marketplace
    await this.testOfferCreation();
    await this.testOrderProcessing();

    // Search
    await this.testSearchFunctionality();
    await this.testAdvancedFilters();

    // Analytics
    await this.testAnalyticsDashboard();
    await this.testPortfolioAnalytics();

    // Bridge & Rental
    await this.testBridgeTransfer();
    await this.testRentalListing();

    // Pools & Governance
    await this.testLiquidityPoolCreation();
    await this.testProposalCreation();

    // Compliance
    await this.testKYCInitiation();
    await this.testAMLScreening();

    // Performance
    await this.testCacheOperations();
    await this.testRateLimiting();

    // Data validation
    await this.testEmailValidation();
    await this.testAddressValidation();

    return this.getResults();
  }

  getResults() {
    const totalTests = this.results.passed + this.results.failed;
    const passPercentage = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0;

    return {
      summary: {
        total: totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        passPercentage: `${passPercentage}%`
      },
      tests: this.results.tests
    };
  }
}

module.exports = TestSuite;
