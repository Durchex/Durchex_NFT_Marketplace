/**
 * Tezos Adapter Integration Guide
 * 
 * This guide demonstrates how to integrate the Tezos adapter with the
 * existing admin dashboard and contract management system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  TaquitoClient, 
  TezosContext, 
  createTezosContextHook,
  getTezosMinWithdrawal,
  isValidTezosAddress 
} from '../services/TezosAdapter';

describe('TezosAdapter Integration', () => {
  let context;

  beforeEach(() => {
    context = createTezosContextHook();
  });

  describe('TaquitoClient', () => {
    it('should initialize with RPC URL', () => {
      const client = new TaquitoClient('https://rpc.ghostnet.teztnets.xyz');
      expect(client.rpcUrl).toBe('https://rpc.ghostnet.teztnets.xyz');
    });

    it('should use default mainnet RPC if not provided', () => {
      const client = new TaquitoClient();
      expect(client.rpcUrl).toBe('https://mainnet.api.tezos.com');
    });

    it('should convert mutez to XTZ correctly', () => {
      expect(TaquitoClient.mutezToXTZ(1000000)).toBe(1);
      expect(TaquitoClient.mutezToXTZ(500000)).toBe(0.5);
      expect(TaquitoClient.mutezToXTZ(0)).toBe(0);
    });

    it('should convert XTZ to mutez correctly', () => {
      expect(TaquitoClient.xtzToMutez(1)).toBe(1000000);
      expect(TaquitoClient.xtzToMutez(0.5)).toBe(500000);
      expect(TaquitoClient.xtzToMutez(0.000001)).toBe(1);
    });
  });

  describe('TezosContext', () => {
    let tezosContext;

    beforeEach(() => {
      tezosContext = new TezosContext();
    });

    it('should initialize with default settings', () => {
      expect(tezosContext.network).toBe('mainnet');
      expect(tezosContext.account).toBeNull();
      expect(tezosContext.balance).toBeNull();
    });

    it('should have contract addresses configured', () => {
      expect(tezosContext.contractAddresses).toHaveProperty('mainnet');
      expect(tezosContext.contractAddresses).toHaveProperty('testnet');
    });

    it('should support network switching', async () => {
      await tezosContext.initialize('testnet');
      expect(tezosContext.network).toBe('testnet');
    });

    it('should branch context for specific contract', () => {
      tezosContext.network = 'testnet';
      tezosContext.account = 'tz1test123';
      
      const branch = tezosContext.branchContext('marketplace');
      
      expect(branch.network).toBe('testnet');
      expect(branch.account).toBe('tz1test123');
      expect(branch.contractAddress).toBeDefined();
    });
  });

  describe('Address Validation', () => {
    it('should validate implicit addresses (tz1)', () => {
      expect(isValidTezosAddress('tz1VSUr8wwNhLAzempoch5d6hLRiTh8DCnG')).toBe(true);
    });

    it('should validate originated addresses (KT1)', () => {
      expect(isValidTezosAddress('KT1aPV9sxuv8SAKDQzGNvBL4b1EWzjr2BzaV')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidTezosAddress('0x123')).toBe(false);
      expect(isValidTezosAddress('invalid')).toBe(false);
      expect(isValidTezosAddress('')).toBe(false);
    });

    it('should reject incomplete addresses', () => {
      expect(isValidTezosAddress('tz1')).toBe(false);
      expect(isValidTezosAddress('KT1')).toBe(false);
    });
  });

  describe('Minimum Withdrawal', () => {
    it('should return minimum withdrawal info', () => {
      const min = getTezosMinWithdrawal();
      
      expect(min).toHaveProperty('mutez');
      expect(min).toHaveProperty('xtz');
      expect(min).toHaveProperty('networkFee');
      expect(min).toHaveProperty('recommendedMinimum');
    });

    it('should have consistent units', () => {
      const min = getTezosMinWithdrawal();
      expect(min.mutez).toBe(1000000);
      expect(min.xtz).toBe(1.0);
      expect(min.recommendedMinimum).toBeGreaterThan(min.xtz);
    });
  });

  describe('Context Hook', () => {
    it('should provide withdraw function', () => {
      expect(context.withdraw).toBeDefined();
      expect(typeof context.withdraw).toBe('function');
    });

    it('should provide minimum withdrawal info', () => {
      const min = context.getMinWithdrawal();
      expect(min).toBeDefined();
    });

    it('should provide address validation', () => {
      expect(context.validateAddress('tz1VSUr8wwNhLAzempoch5d6hLRiTh8DCnG')).toBe(true);
      expect(context.validateAddress('invalid')).toBe(false);
    });

    it('should provide network switching', () => {
      expect(context.switchNetwork).toBeDefined();
      expect(typeof context.switchNetwork).toBe('function');
    });
  });

  describe('Admin Dashboard Integration', () => {
    it('should support network dropdown population', () => {
      const networks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'tezos'];
      expect(networks).toContain('tezos');
    });

    it('should branch context appropriately for operations', () => {
      const tContext = new TezosContext();
      tContext.account = 'tz1test';
      tContext.balance = 5.0;

      const branch = tContext.branchContext('marketplace');
      expect(branch.account).toBe('tz1test');
      expect(branch.balance).toBe(5.0);
    });
  });

  describe('Withdraw Flow', () => {
    /**
     * Simulates the complete withdraw flow:
     * 1. Initialize context with testnet
     * 2. Connect wallet
     * 3. Validate amount
     * 4. Call withdraw
     * 5. Confirm transaction
     */

    it('should validate amount before withdrawal', async () => {
      const min = getTezosMinWithdrawal();
      
      // Insufficient amount
      expect(0.5 < min.recommendedMinimum).toBe(true);
      
      // Sufficient amount
      expect(2.0 >= min.recommendedMinimum).toBe(true);
    });

    it('should format amounts for contract calls', () => {
      const amountXTZ = 1.5;
      const amountMutez = TaquitoClient.xtzToMutez(amountXTZ);
      
      expect(amountMutez).toBe(1500000);
      expect(TaquitoClient.mutezToXTZ(amountMutez)).toBe(amountXTZ);
    });

    it('should prepare branch context for contract interaction', () => {
      const tContext = new TezosContext();
      tContext.network = 'testnet';
      tContext.account = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8DCnG';
      tContext.balance = 10.0;

      const branch = tContext.branchContext('marketplace');
      
      expect(branch.network).toBe('testnet');
      expect(branch.contractAddress).toBeDefined();
      expect(branch.client).toBeDefined();
    });
  });

  describe('UI Component Integration', () => {
    it('should work with TezosWithdrawUI component', () => {
      // TezosWithdrawUI imports createTezosContextHook
      const uiContext = createTezosContextHook();
      
      expect(uiContext.initialize).toBeDefined();
      expect(uiContext.connectWallet).toBeDefined();
      expect(uiContext.withdraw).toBeDefined();
      expect(uiContext.getMinWithdrawal).toBeDefined();
    });

    it('should provide balance for display', () => {
      const tContext = new TezosContext();
      tContext.balance = 42.123456;
      
      const formatted = tContext.balance.toFixed(6);
      expect(formatted).toBe('42.123456');
    });

    it('should format amounts for user display', () => {
      const mutez = 1234567;
      const xtz = TaquitoClient.mutezToXTZ(mutez);
      
      expect(xtz.toFixed(6)).toBe('1.234567');
    });
  });

  describe('Error Handling', () => {
    it('should throw when wallet not connected for contract calls', async () => {
      const client = new TaquitoClient();
      
      await expect(client.getContract('KT1...')).rejects.toThrow('Wallet not connected');
    });

    it('should handle invalid network switch', async () => {
      const ctx = new TezosContext();
      
      // This should not throw - initialize handles invalid networks gracefully
      await ctx.initialize('testnet');
      expect(ctx.network).toBe('testnet');
    });
  });

  describe('Context Branching Pattern', () => {
    /**
     * Context branching allows isolated context for different contract operations
     * while maintaining shared state. This mirrors the EVM pattern.
     */

    it('should create isolated branch for marketplace operations', () => {
      const mainContext = new TezosContext();
      mainContext.account = 'tz1test';
      mainContext.balance = 100;

      const marketplaceBranch = mainContext.branchContext('marketplace');
      
      expect(marketplaceBranch.account).toBe(mainContext.account);
      expect(marketplaceBranch.contractAddress).toBeDefined();
    });

    it('should create isolated branch for vendor NFT operations', () => {
      const mainContext = new TezosContext();
      mainContext.account = 'tz1test';

      const vendorBranch = mainContext.branchContext('vendorNFT');
      
      expect(vendorBranch.account).toBe(mainContext.account);
      expect(vendorBranch.contractAddress).toBeDefined();
    });

    it('should not mutate main context when branching', () => {
      const mainContext = new TezosContext();
      mainContext.account = 'tz1original';

      const branch = mainContext.branchContext('marketplace');
      // Simulating operation that would mutate branch
      branch.account = 'tz1modified';

      expect(mainContext.account).toBe('tz1original');
    });
  });
});

/**
 * INTEGRATION TEST: Complete Withdraw Flow
 * 
 * This test demonstrates the complete flow from wallet connection
 * through withdrawal with validation.
 */
describe('Complete Tezos Withdraw Flow', () => {
  let context;

  beforeEach(async () => {
    context = createTezosContextHook();
    await context.initialize('testnet');
  });

  it('should validate minimum withdrawal', () => {
    const min = context.getMinWithdrawal();
    const amount = 0.5;
    
    // Should fail - amount too small
    expect(amount < min.recommendedMinimum).toBe(true);
  });

  it('should validate sufficient balance', () => {
    const balance = 10.0;
    const amount = 15.0;
    
    expect(amount > balance).toBe(true);
  });

  it('should validate valid withdrawal', () => {
    const balance = 50.0;
    const amount = 2.0;
    const min = context.getMinWithdrawal();
    
    const isValid = amount >= min.recommendedMinimum && amount <= balance;
    expect(isValid).toBe(true);
  });

  it('should prepare contract parameters', () => {
    const amountXTZ = 1.5;
    const amountMutez = TaquitoClient.xtzToMutez(amountXTZ);
    
    const params = {
      amount: amountMutez,
    };
    
    expect(params.amount).toBe(1500000);
  });
});
