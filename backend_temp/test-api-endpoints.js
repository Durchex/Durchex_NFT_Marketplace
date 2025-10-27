import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testUser = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    username: 'TestUser',
    email: 'test@example.com',
    bio: 'Test user bio',
    image: 'https://example.com/profile.jpg',
    socialLinks: [
        'https://twitter.com/testuser',
        'testuser#1234'
    ]
};

const testNFT = {
    network: 'Ethereum',
    itemId: '123',
    tokenId: '456',
    nftContract: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    owner: '0x1234567890123456789012345678901234567890',
    seller: '0x1234567890123456789012345678901234567890',
    price: '1.5',
    currentlyListed: true,
    name: 'Test NFT',
    description: 'Test NFT description',
    image: 'https://example.com/nft.jpg',
    category: 'Art',
    properties: {
        rarity: 'Common',
        color: 'Blue',
        size: 'Medium'
    },
    royalties: {
        percentage: 2.5,
        recipient: '0x1234567890123456789012345678901234567890'
    }
};

const testCartItem = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    nftId: '123',
    contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Test NFT',
    price: '1.5',
    image: 'https://example.com/nft.jpg'
};

async function testAPIEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');

    try {
        // Test 1: Base endpoint
        console.log('1. Testing base endpoint...');
        const baseResponse = await axios.get('http://localhost:3000/');
        console.log('✅ Base endpoint:', baseResponse.data);
        console.log('');

        // Test 2: Get all users (should return empty array initially)
        console.log('2. Testing GET /api/v1/user/users...');
        const usersResponse = await axios.get(`${BASE_URL}/user/users`);
        console.log('✅ Get users:', usersResponse.data);
        console.log('');

        // Test 3: Create user
        console.log('3. Testing POST /api/v1/user/users (create user)...');
        const createUserResponse = await axios.post(`${BASE_URL}/user/users`, testUser);
        console.log('✅ Create user:', createUserResponse.data);
        console.log('');

        // Test 4: Get specific user
        console.log('4. Testing GET /api/v1/user/users/:walletAddress...');
        const getUserResponse = await axios.get(`${BASE_URL}/user/users/${testUser.walletAddress}`);
        console.log('✅ Get user:', getUserResponse.data);
        console.log('');

        // Test 5: Update user
        console.log('5. Testing PUT /api/v1/user/users/:walletAddress (update user)...');
        const updatedUser = { ...testUser, bio: 'Updated bio' };
        const updateUserResponse = await axios.put(`${BASE_URL}/user/users/${testUser.walletAddress}`, updatedUser);
        console.log('✅ Update user:', updateUserResponse.data);
        console.log('');

        // Test 6: Get all users again (should now have 1 user)
        console.log('6. Testing GET /api/v1/user/users (should now have 1 user)...');
        const usersResponse2 = await axios.get(`${BASE_URL}/user/users`);
        console.log('✅ Get users (after creation):', usersResponse2.data);
        console.log('');

        // Test 7: NFT endpoints
        console.log('7. Testing NFT endpoints...');
        const nftResponse = await axios.post(`${BASE_URL}/nft/nfts`, testNFT);
        console.log('✅ Create NFT:', nftResponse.data);
        console.log('');

        // Test 8: Get NFT
        console.log('8. Testing GET NFT...');
        const getNFTResponse = await axios.get(`${BASE_URL}/nft/nft/${testNFT.network}/${testNFT.itemId}/${testNFT.tokenId}`);
        console.log('✅ Get NFT:', getNFTResponse.data);
        console.log('');

        // Test 9: Cart endpoints
        console.log('9. Testing Cart endpoints...');
        const cartResponse = await axios.post(`${BASE_URL}/cart`, testCartItem);
        console.log('✅ Add to cart:', cartResponse.data);
        console.log('');

        // Test 10: Get cart
        console.log('10. Testing GET cart...');
        const getCartResponse = await axios.get(`${BASE_URL}/cart/cart/${testUser.walletAddress}`);
        console.log('✅ Get cart:', getCartResponse.data);
        console.log('');

        // Test 11: Remove from cart
        console.log('11. Testing DELETE from cart...');
        const removeCartResponse = await axios.delete(`${BASE_URL}/cart/${testUser.walletAddress}/${testCartItem.nftId}/${testCartItem.contractAddress}`);
        console.log('✅ Remove from cart:', removeCartResponse.data);
        console.log('');

        // Test 12: Clear cart
        console.log('12. Testing clear cart...');
        const clearCartResponse = await axios.delete(`${BASE_URL}/cart/${testUser.walletAddress}`);
        console.log('✅ Clear cart:', clearCartResponse.data);
        console.log('');

        // Test 13: Delete user
        console.log('13. Testing DELETE user...');
        const deleteUserResponse = await axios.delete(`${BASE_URL}/user/users/${testUser.walletAddress}`);
        console.log('✅ Delete user:', deleteUserResponse.data);
        console.log('');

        console.log('🎉 All API endpoints tested successfully!');

    } catch (error) {
        console.error('❌ API Test Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
    }
}

// Run the tests
testAPIEndpoints();
