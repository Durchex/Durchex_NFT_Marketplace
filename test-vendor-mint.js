import { ethers } from 'ethers';

// Contract ABI - just the functions we need
const VendorNFT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_tokenURI", "type": "string"},
      {"internalType": "address", "name": "contractAddress", "type": "address"}
    ],
    "name": "vendorMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses for Base network
const VENDOR_NFT_ADDRESS = '0xb0F0733302967e210B61f50b59511B3F119aE869';
const MARKETPLACE_ADDRESS = '0x1BBE1EC42D897e2f0dd39B6Cc6c1070515f7B307';

// Base network RPC
const RPC_URL = 'https://mainnet.base.org';

async function testVendorMint() {
  console.log('🚀 Starting VendorNFT minting test...\n');

  try {
    // Connect to Base network
    console.log('📡 Connecting to Base network...');
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to Base network\n');

    // Check network
    const network = await provider.getNetwork();
    console.log('🌐 Network:', network.name, '(Chain ID:', network.chainId, ')\n');

    // Check if contract exists at the address
    console.log('🔍 Checking if contract exists at address...');
    const code = await provider.getCode(VENDOR_NFT_ADDRESS);
    console.log('📄 Contract bytecode length:', code.length);

    if (code === '0x') {
      console.log('❌ NO CONTRACT FOUND at address:', VENDOR_NFT_ADDRESS);
      console.log('🔧 This explains why minting fails - contract not deployed!');
      return;
    } else {
      console.log('✅ Contract exists at address:', VENDOR_NFT_ADDRESS);
    }

    console.log('🏪 Marketplace address:', MARKETPLACE_ADDRESS, '\n');

    // Create contract instance (read-only for now)
    const contract = new ethers.Contract(VENDOR_NFT_ADDRESS, VendorNFT_ABI, provider);

    // Check initial state - try functions that exist in the ABI
    console.log('📊 Checking initial contract state...');
    try {
      const vendor0 = await contract.vendorList(0);
      console.log('👤 Vendor at index 0:', vendor0);
    } catch (error) {
      console.log('⚠️  vendorList(0) call failed:', error.message);
    }

    // Try owner() function
    try {
      const contractOwner = await contract.owner();
      console.log('👑 Contract owner:', contractOwner);
    } catch (error) {
      console.log('⚠️  owner() call failed:', error.message);
    }

    // Try checking if vendorMint function exists by calling it (will fail but shows if it exists)
    console.log('\n🔧 Testing vendorMint function signature...');
    try {
      // This will fail because we don't have a signer, but it will tell us if the function exists
      await contract.vendorMint('test', MARKETPLACE_ADDRESS);
    } catch (error) {
      if (error.message.includes('vendorMint is not a function')) {
        console.log('❌ vendorMint function does NOT exist in contract');
      } else {
        console.log('✅ vendorMint function exists (failed for other reasons):', error.message.split('\n')[0]);
      }
    }

    // For this test, we'll just check if we can read the contract
    // To actually test minting, we'd need a signer with gas

    console.log('\n🔍 Contract Analysis:');
    console.log('- Contract exists at address:', VENDOR_NFT_ADDRESS);
    console.log('- Marketplace address configured:', MARKETPLACE_ADDRESS);

    console.log('\n⚠️  Note: To test actual minting, we would need:');
    console.log('1. A wallet with Base ETH for gas fees');
    console.log('2. The wallet to be authorized as a vendor');
    console.log('3. Call vendorMint() and check for Transfer events');

    console.log('\n📋 Based on frontend logs, the issue is:');
    console.log('- Transactions are successful (mined)');
    console.log('- But NO events/logs are emitted');
    console.log('- This means the contract is NOT emitting Transfer events');

    console.log('\n🔧 Recommended fix:');
    console.log('1. Check the VendorNFT contract source code');
    console.log('2. Ensure vendorMint() emits Transfer events');
    console.log('3. Verify the _mint() or _safeMint() calls are correct');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testVendorMint().then(() => {
  console.log('\n✨ Test completed');
}).catch((error) => {
  console.error('💥 Test failed:', error);
});