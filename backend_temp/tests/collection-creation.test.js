import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Test data
const testCollection = {
  name: 'Test Art Collection ' + Date.now(),
  description: 'A test collection for verifying the collection creation workflow',
  image: 'https://via.placeholder.com/200?text=TestCollection',
  category: 'art',
  network: 'polygon',
  creatorWallet: '0x1234567890123456789012345678901234567890',
  creatorName: 'Test Creator',
};

const testNFT = {
  name: 'Test NFT #1',
  description: 'First test NFT in collection',
  image: 'https://via.placeholder.com/200?text=TestNFT',
  itemId: 'test_nft_' + Date.now(),
  network: 'polygon',
  owner: '0x1234567890123456789012345678901234567890',
  seller: '0x1234567890123456789012345678901234567890',
  price: '1.5',
  floorPrice: '1.0',
  currentlyListed: true,
  category: 'art',
  properties: { rarity: 'rare', color: 'blue' },
};

async function testCollectionCreation() {
  console.log('\n🔍 Testing Collection Creation Workflow\n');
  console.log('=' .repeat(60));

  try {
    // 1. Create a collection
    console.log('\n📦 Step 1: Creating a new collection...');
    console.log('Request:', testCollection);
    
    const createResponse = await axios.post(`${API_BASE}/nft/collections`, testCollection);
    const collection = createResponse.data;
    
    console.log('✅ Collection created successfully!');
    console.log('Collection ID:', collection._id);
    console.log('Collection Details:', {
      name: collection.name,
      collectionId: collection.collectionId,
      network: collection.network,
      creatorWallet: collection.creatorWallet,
    });

    // 2. Get the collection by ID
    console.log('\n📖 Step 2: Retrieving collection by ID...');
    const getResponse = await axios.get(`${API_BASE}/nft/collections/single/${collection._id}`);
    const retrievedCollection = getResponse.data;
    
    console.log('✅ Collection retrieved successfully!');
    console.log('Collection name:', retrievedCollection.name);

    // 3. Get user collections
    console.log('\n👤 Step 3: Fetching user collections...');
    const userCollResponse = await axios.get(`${API_BASE}/nft/collections/user/${testCollection.creatorWallet}`);
    const userCollections = userCollResponse.data;
    
    console.log('✅ User collections retrieved!');
    console.log('Number of user collections:', userCollections.length);

    // 4. Create an NFT with the collection
    console.log('\n🎨 Step 4: Creating an NFT in the collection...');
    const nftData = {
      ...testNFT,
      collection: collection.collectionId,
      // Removed metadataURI - NFT creation now works without IPFS
      isMinted: false,
      currentlyListed: true
    };
    
    const createNftResponse = await axios.post(`${API_BASE}/nft/nfts`, nftData);
    const nft = createNftResponse.data;
    
    console.log('✅ NFT created successfully!');
    console.log('NFT ID:', nft._id);
    console.log('NFT in collection:', nft.collection);

    // 5. Get NFTs in the collection
    console.log('\n📂 Step 5: Fetching NFTs in the collection...');
    const collectionNftsResponse = await axios.get(`${API_BASE}/nft/collections/${collection.collectionId}/nfts`);
    const collectionNfts = collectionNftsResponse.data;
    
    console.log('✅ Collection NFTs retrieved!');
    console.log('Number of NFTs in collection:', collectionNfts.length);

    // 6. Update the collection
    console.log('\n✏️ Step 6: Updating the collection...');
    const updateData = {
      description: 'Updated collection description',
      royalty: 10,
    };
    
    const updateResponse = await axios.patch(`${API_BASE}/nft/collections/${collection._id}`, updateData);
    const updatedCollection = updateResponse.data;
    
    console.log('✅ Collection updated successfully!');
    console.log('Updated description:', updatedCollection.description);
    console.log('Updated royalty:', updatedCollection.royalty);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('- Collection created successfully');
    console.log('- Collection retrieved by ID');
    console.log('- User collections fetched');
    console.log('- NFT added to collection');
    console.log('- Collection NFTs fetched');
    console.log('- Collection updated successfully\n');

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.response?.data || error.message);
    console.error('\nFull Error Details:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testCollectionCreation();
