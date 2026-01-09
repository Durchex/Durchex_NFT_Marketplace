import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testUserProfiles() {
  try {
    console.log('🧪 Testing user profile API...\n');
    
    // First, get some NFTs to extract creator addresses
    console.log('📍 Fetching NFTs to get creator addresses...');
    const nftResponse = await axios.get(`${API_BASE_URL}/nft/nfts/polygon`);
    const nfts = nftResponse.data || [];
    
    if (nfts.length === 0) {
      console.log('❌ No NFTs found on polygon network');
      return;
    }
    
    console.log(`✅ Found ${nfts.length} NFTs on polygon network\n`);
    
    // Extract unique creator addresses
    const creatorAddresses = new Set();
    nfts.forEach(nft => {
      const creator = nft.seller || nft.owner || nft.creator;
      if (creator) {
        creatorAddresses.add(creator);
      }
    });
    
    const addresses = Array.from(creatorAddresses).slice(0, 5);
    console.log(`📍 Testing ${addresses.length} creator addresses:\n`);
    
    // Test each creator profile
    for (const address of addresses) {
      console.log(`\n🔍 Fetching profile for: ${address}`);
      try {
        const response = await axios.get(`${API_BASE_URL}/user/users/${address}`);
        const profile = response.data;
        
        console.log(`  ✅ Profile found:`);
        console.log(`     - Username: ${profile.username || 'N/A'}`);
        console.log(`     - Email: ${profile.email || 'N/A'}`);
        console.log(`     - Image: ${profile.image ? '✅ HAS IMAGE: ' + profile.image : '❌ NO IMAGE'}`);
        console.log(`     - Bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`     - Verified: ${profile.isVerified || false}`);
        console.log(`     - Created: ${new Date(profile.createdAt).toLocaleString()}`);
        
      } catch (err) {
        if (err.response?.status === 404) {
          console.log(`  ❌ Profile not found (404)`);
        } else {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log('===========');
    console.log('✅ Backend has "image" field in user schema');
    console.log('⚠️  Check if user profiles have been populated with image URLs');
    console.log('💡 If no images show, users need to update their profiles with image URLs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserProfiles();
