/**
 * NFT Creation with Collection Association Test
 * Tests the simplified NFT creation workflow without IPFS metadata uploads
 */

const axios = require('axios');

const API_BASE = 'https://durchex.com/api/v1';

// Test data - matches the successful test we ran
const testNFTData = {
  itemId: 'test_with_collection_' + Date.now(),
  network: 'polygon',
  owner: '0x628cb64abdaa05caefed34038b05463482e202d7',
  seller: '0x628cb64abdaa05caefed34038b05463482e202d7',
  price: '0.1',
  name: 'Test NFT with Collection',
  description: 'Test NFT associated with Luna Collection',
  image: 'https://example.com/test-nft.png',
  category: 'art',
  properties: {},
  collection: '1768390917767_bhucs2mkw', // Luna NFT Collection ID
  isMinted: false,
  currentlyListed: true
};

let createdNFTId = null;
let createdSingleNFTId = null;

describe('NFT Creation & Collection Association', () => {

  it('NC001: Should create NFT with collection association', async () => {
    const response = await axios.post(`${API_BASE}/nft/nfts`, testNFTData);

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('_id');
    expect(response.data.name).toBe(testNFTData.name);
    expect(response.data.network).toBe(testNFTData.network);
    expect(response.data.collection).toBe(testNFTData.collection);
    expect(response.data.currentlyListed).toBe(true);
    expect(response.data.price).toBe(testNFTData.price);
    expect(response.data.category).toBe(testNFTData.category);

    createdNFTId = response.data._id;
  });

  it('NC002: Should verify NFT appears in collection', async () => {
    const response = await axios.get(`${API_BASE}/nft/collections/${testNFTData.collection}/nfts`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    // Find our NFT in the collection
    const ourNFT = response.data.find(nft => nft._id === createdNFTId);
    expect(ourNFT).toBeDefined();
    expect(ourNFT.name).toBe(testNFTData.name);
    expect(ourNFT.itemId).toBe(testNFTData.itemId);
    expect(ourNFT.collection).toBe(testNFTData.collection);
  });

  it('NC003: Should verify collection exists', async () => {
    const response = await axios.get(`${API_BASE}/nft/collections`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);

    const targetCollection = response.data.find(c => c.collectionId === testNFTData.collection);
    expect(targetCollection).toBeDefined();
    expect(targetCollection.name).toBe('Luna NFT Collection');
    expect(targetCollection.creatorWallet).toBe(testNFTData.owner);
  });

  it('NC004: Should create single NFT without collection', async () => {
    const singleNFTData = {
      ...testNFTData,
      itemId: 'test_single_nft_' + Date.now(),
      name: 'Test Single NFT',
      collection: null, // No collection
    };

    const response = await axios.post(`${API_BASE}/nft/nfts`, singleNFTData);

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('_id');
    expect(response.data.collection).toBeNull();

    createdSingleNFTId = response.data._id;
  });

  it('NC005: Should verify single NFT has no collection association', async () => {
    // Get all NFTs for the network to verify single NFT
    const response = await axios.get(`${API_BASE}/nft/nfts/polygon`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);

    const singleNFT = response.data.find(nft => nft._id === createdSingleNFTId);
    expect(singleNFT).toBeDefined();
    expect(singleNFT.collection).toBeNull();
  });

});