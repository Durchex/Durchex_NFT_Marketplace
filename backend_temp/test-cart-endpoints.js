import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

const testCartItem = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    nftId: 123,
    contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    quantity: 1
};

async function testCartEndpoints() {
    console.log('🧪 Testing Cart Endpoints...\n');

    try {
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 1: Add to cart
        console.log('1. Testing POST /api/v1/cart (add to cart)...');
        const addCartResponse = await axios.post(`${BASE_URL}/cart`, testCartItem);
        console.log('✅ Add to cart:', addCartResponse.data);
        console.log('');

        // Test 2: Get cart
        console.log('2. Testing GET /api/v1/cart/cart/:walletAddress...');
        const getCartResponse = await axios.get(`${BASE_URL}/cart/cart/${testCartItem.walletAddress}`);
        console.log('✅ Get cart:', getCartResponse.data);
        console.log('');

        // Test 3: Remove from cart
        console.log('3. Testing DELETE /api/v1/cart/cart/:walletAddress/:nftId/:contractAddress...');
        const removeCartResponse = await axios.delete(`${BASE_URL}/cart/cart/${testCartItem.walletAddress}/${testCartItem.nftId}/${testCartItem.contractAddress}`);
        console.log('✅ Remove from cart:', removeCartResponse.data);
        console.log('');

        // Test 4: Clear cart
        console.log('4. Testing DELETE /api/v1/cart/cart/:walletAddress (clear cart)...');
        const clearCartResponse = await axios.delete(`${BASE_URL}/cart/cart/${testCartItem.walletAddress}`);
        console.log('✅ Clear cart:', clearCartResponse.data);
        console.log('');

        console.log('🎉 All Cart endpoints tested successfully!');

    } catch (error) {
        console.error('❌ Cart Test Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
    }
}

// Run the tests
testCartEndpoints();
