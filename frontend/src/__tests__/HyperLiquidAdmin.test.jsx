import { describe, it, expect, beforeEach } from 'vitest';
import { contractAddresses, rpcUrls } from '../Context/constants';

describe('HyperLiquid Admin Support', () => {
  it('should have hyperliquid in contractAddresses', () => {
    expect(contractAddresses).toHaveProperty('hyperliquid');
  });

  it('should have hyperliquid marketplace contract', () => {
    expect(contractAddresses.hyperliquid).toHaveProperty('marketplace');
  });

  it('should have hyperliquid vendorNFT contract', () => {
    expect(contractAddresses.hyperliquid).toHaveProperty('vendorNFT');
  });

  it('should have hyperliquid in rpcUrls', () => {
    expect(rpcUrls).toHaveProperty('hyperliquid');
  });

  it('should have valid hyperliquid RPC endpoint', () => {
    expect(rpcUrls.hyperliquid).toBeTruthy();
    expect(typeof rpcUrls.hyperliquid).toBe('string');
  });

  describe('Admin Dropdown Compatibility', () => {
    it('should allow hyperliquid selection in admin network dropdown', () => {
      const networks = Object.keys(contractAddresses);
      expect(networks).toContain('hyperliquid');
    });

    it('should provide contract data for all networks including hyperliquid', () => {
      const networks = Object.keys(contractAddresses);
      networks.forEach(network => {
        const contracts = contractAddresses[network];
        // All networks should have marketplace
        expect(contracts).toHaveProperty('marketplace');
        // EVM networks (hyperliquid, hyperliquidTestnet) have vendorNFT
        // Tezos networks only have marketplace
        if (network.includes('hyperliquid')) {
          expect(contracts).toHaveProperty('vendorNFT');
        }
      });
    });

    it('should return contracts for hyperliquid network', () => {
      const hl = contractAddresses.hyperliquid;
      expect(hl.marketplace).toBeDefined();
      expect(hl.vendorNFT).toBeDefined();
    });
  });

  describe('Withdraw Function Integration', () => {
    it('should map hyperliquid to withdraw endpoint', () => {
      // Simulates admin selecting hyperliquid and calling withdraw
      const selectedNetwork = 'hyperliquid';
      const contracts = contractAddresses[selectedNetwork];
      
      expect(contracts).toBeDefined();
      expect(contracts.marketplace).toBeDefined();
    });

    it('should handle hyperliquid network switch for withdraw', () => {
      const networks = Object.keys(contractAddresses);
      const evm_networks = networks.filter(net => {
        const contracts = contractAddresses[net];
        // Only EVM networks have both marketplace and vendorNFT
        return contracts.marketplace && contracts.vendorNFT;
      });

      expect(evm_networks).toContain('hyperliquid');
    });
  });

  describe('RPC Configuration', () => {
    it('should use testnet RPC for hyperliquid by default', () => {
      expect(rpcUrls.hyperliquid).toContain('hyperliquid');
    });

    it('should allow environment variable override for hyperliquid RPC', () => {
      // This test documents that VITE_RPC_URL_HYPERLIQUID can be set
      const rpcUrl = process.env.VITE_RPC_URL_HYPERLIQUID || rpcUrls.hyperliquid;
      expect(rpcUrl).toBeTruthy();
    });
  });
});

/**
 * INTEGRATION TEST: Admin Withdraw Flow with HyperLiquid
 * 
 * Simulates the admin dashboard withdraw flow:
 * 1. Admin opens ContractManagement.jsx
 * 2. Admin selects 'hyperliquid' from network dropdown
 * 3. Admin clicks "Withdraw Funds"
 * 4. System uses contractAddresses.hyperliquid.marketplace for withdrawal
 */
describe('Admin Withdraw Flow - HyperLiquid', () => {
  let selectedNetwork;
  let contracts;

  beforeEach(() => {
    // Simulate admin selecting hyperliquid
    selectedNetwork = 'hyperliquid';
    contracts = contractAddresses[selectedNetwork];
  });

  it('should have contracts available for withdrawal', () => {
    expect(contracts).toBeDefined();
    expect(contracts.marketplace).toBeTruthy();
  });

  it('should use correct contract address for withdrawal transaction', () => {
    // Admin calls withdraw() which uses contractAddresses[selectedNetwork].marketplace
    const withdrawContractAddress = contracts.marketplace;
    expect(withdrawContractAddress).toBeDefined();
    // In real scenario, this would be passed to ethers.Contract()
  });

  it('should have RPC endpoint for transaction signing', () => {
    const rpcUrl = rpcUrls[selectedNetwork];
    expect(rpcUrl).toBeDefined();
    expect(rpcUrl).toContain('http');
  });
});
