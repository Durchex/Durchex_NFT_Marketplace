/**
 * Debug Script: Check Creator Name Fetching
 * Run this to see what creator data is being returned from the backend
 */

const BASE_URL = 'https://durchex.com/api'; // Change to your backend URL

async function debugCreatorFetching() {
  console.log('🔍 Debugging Creator Name Fetching\n');

  try {
    // First, fetch NFTs to get creator addresses
    console.log('📌 Step 1: Fetching NFTs...');
    const nftsResponse = await fetch(`${BASE_URL}/nfts/polygon`);
    if (!nftsResponse.ok) {
      console.error('Failed to fetch NFTs:', nftsResponse.status);
      return;
    }
    
    const nfts = await nftsResponse.json();
    console.log(`✅ Found ${nfts.length} NFTs`);
    
    // Extract unique creator addresses
    console.log('\n📌 Step 2: Extracting creator addresses...');
    const uniqueCreators = new Set();
    nfts.forEach(nft => {
      const creator = nft.creator || nft.owner;
      if (creator) {
        uniqueCreators.add(creator);
      }
    });
    
    const creatorAddresses = Array.from(uniqueCreators).slice(0, 5);
    console.log(`✅ Found ${creatorAddresses.length} unique creators`);
    console.log('Addresses:', creatorAddresses);
    
    // Now fetch profiles for each creator
    console.log('\n📌 Step 3: Fetching creator profiles...');
    for (const address of creatorAddresses) {
      try {
        console.log(`\n  Fetching profile for: ${address}`);
        const profileResponse = await fetch(`${BASE_URL}/users/${address}`);
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          console.log(`  ✅ Username: ${profile.username || 'NOT FOUND'}`);
          console.log(`     Bio: ${profile.bio || 'N/A'}`);
          console.log(`     Followers: ${profile.followers || 0}`);
        } else {
          console.log(`  ❌ Profile fetch failed: ${profileResponse.status}`);
          console.log(`     Fallback: ${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        console.log(`     Fallback: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug function
debugCreatorFetching();
