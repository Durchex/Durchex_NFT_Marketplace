import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

async function testCollectionWorkflow() {
  console.log('\n✅ TESTING COLLECTION CREATION WORKFLOW\n');
  console.log('='.repeat(60));

  try {
    // Create a collection
    console.log('\n1️⃣  Creating a collection...');
    const collectionData = {
      name: `Test Collection ${Date.now()}`,
      description: 'Test collection for local development',
      image: 'https://via.placeholder.com/200?text=TestCollection',
      category: 'art',
      network: 'polygon',
      creatorWallet: '0xuser123456789012345678901234567890',
      creatorName: 'Test User',
    };

    const createResp = await axios.post(`${API_BASE}/nft/collections`, collectionData);
    const collection = createResp.data;
    console.log('✅ Collection created!');
    console.log(`   Name: ${collection.name}`);
    console.log(`   ID: ${collection._id}`);
    console.log(`   Collection ID: ${collection.collectionId}`);

    // Get the collection
    console.log('\n2️⃣  Retrieving collection by ID...');
    const getResp = await axios.get(`${API_BASE}/nft/collections/single/${collection._id}`);
    console.log('✅ Collection retrieved!');
    console.log(`   Retrieved: ${getResp.data.name}`);

    // Get user collections
    console.log('\n3️⃣  Fetching user collections...');
    const userResp = await axios.get(`${API_BASE}/nft/collections/user/${collectionData.creatorWallet}`);
    console.log('✅ User collections fetched!');
    console.log(`   Total collections for user: ${userResp.data.length}`);

    // Create an NFT in the collection
    console.log('\n4️⃣  Creating NFT in the collection...');
    const nftData = {
      name: 'Test NFT #1',
      description: 'First NFT in collection',
      image: 'https://via.placeholder.com/200?text=TestNFT',
      itemId: `test_${Date.now()}`,
      network: 'polygon',
      owner: collectionData.creatorWallet,
      seller: collectionData.creatorWallet,
      price: '1.5',
      floorPrice: '1.0',
      currentlyListed: true,
      category: 'art',
      properties: { rarity: 'rare', color: 'blue' },
      collection: collection.collectionId,
    };

    const nftResp = await axios.post(`${API_BASE}/nft/nfts`, nftData);
    console.log('✅ NFT created in collection!');
    console.log(`   NFT Name: ${nftResp.data.name}`);
    console.log(`   Collection: ${nftResp.data.collection}`);

    // Get NFTs in collection
    console.log('\n5️⃣  Fetching NFTs in collection...');
    const nftsResp = await axios.get(`${API_BASE}/nft/collections/${collection.collectionId}/nfts`);
    console.log('✅ Collection NFTs fetched!');
    console.log(`   NFTs in collection: ${nftsResp.data.length}`);

    // Update collection
    console.log('\n6️⃣  Updating collection...');
    const updateResp = await axios.patch(`${API_BASE}/nft/collections/${collection._id}`, {
      royalty: 10,
      description: 'Updated description',
    });
    console.log('✅ Collection updated!');
    console.log(`   New royalty: ${updateResp.data.royalty}%`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! Collection creation workflow is working!\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testCollectionWorkflow();
