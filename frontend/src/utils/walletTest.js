// Test utility for wallet connection debugging
// Can be called from browser console: window.testWalletConnection('metamask')

export const testWalletConnection = async (walletId = 'metamask') => {
  console.log('=== WALLET CONNECTION TEST ===');
  console.log('Testing wallet:', walletId);
  
  if (typeof window === 'undefined') {
    console.error('Window is undefined');
    return;
  }

  // Check if window.ethereum exists
  if (!window.ethereum) {
    console.error('window.ethereum is not available');
    return;
  }

  console.log('window.ethereum:', window.ethereum);
  console.log('window.ethereum.providers:', window.ethereum.providers);
  console.log('window.ethereum.isMetaMask:', window.ethereum.isMetaMask);
  console.log('window.ethereum.isCoinbaseWallet:', window.ethereum.isCoinbaseWallet);
  console.log('window.ethereum.request:', typeof window.ethereum.request);

  // Test provider detection
  let provider = null;
  if (walletId === 'metamask') {
    if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
      provider = window.ethereum;
      console.log('✓ Found MetaMask as window.ethereum');
    } else if (Array.isArray(window.ethereum.providers)) {
      provider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
      if (provider) {
        console.log('✓ Found MetaMask in providers array');
      } else {
        console.error('✗ MetaMask not found in providers array');
      }
    }
  } else if (walletId === 'coinbase') {
    if (window.ethereum.isCoinbaseWallet) {
      provider = window.ethereum;
      console.log('✓ Found Coinbase Wallet as window.ethereum');
    } else if (Array.isArray(window.ethereum.providers)) {
      provider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
      if (provider) {
        console.log('✓ Found Coinbase Wallet in providers array');
      } else {
        console.error('✗ Coinbase Wallet not found in providers array');
      }
    }
  }

  if (!provider) {
    console.error('✗ Could not find provider for', walletId);
    return;
  }

  console.log('Provider found:', provider);
  console.log('Provider has request method:', typeof provider.request === 'function');

  // Test connection
  try {
    console.log('Attempting to request accounts...');
    const accounts = await provider.request({
      method: "eth_requestAccounts",
    });
    console.log('✓ Success! Accounts:', accounts);
    return accounts;
  } catch (error) {
    console.error('✗ Error requesting accounts:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.testWalletConnection = testWalletConnection;
}
