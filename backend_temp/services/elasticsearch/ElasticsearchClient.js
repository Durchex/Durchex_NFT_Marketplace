// Import with error handling - if this fails, the class will handle it
import logger from '../../utils/logger.js';

// Lazy load Client to prevent startup crashes
let Client = null;
let elasticsearchAvailable = false;

async function loadElasticsearch() {
  if (Client !== null) return Client; // Already tried
  
  try {
    const elasticsearchModule = await import('@elastic/elasticsearch');
    Client = elasticsearchModule.Client || elasticsearchModule.default?.Client;
    elasticsearchAvailable = true;
    return Client;
  } catch (error) {
    console.warn('⚠️  @elastic/elasticsearch failed to load:', error.message);
    console.warn('   This is usually due to undici/File API compatibility issue');
    console.warn('   Elasticsearch features will be disabled');
    elasticsearchAvailable = false;
    return null;
  }
}

class ElasticsearchClient {
  constructor() {
    this.available = false;
    this.client = null;
    this._initialized = false;
  }

  async _ensureInitialized() {
    if (this._initialized) return;
    
    const ElasticsearchClient = await loadElasticsearch();
    
    if (!ElasticsearchClient) {
      this.available = false;
      this._initialized = true;
      return;
    }
    
    try {
      this.client = new ElasticsearchClient({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USER || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
        },
        maxRetries: 5,
        requestTimeout: 30000,
        sniffOnStart: true,
      });
      this.available = true;
    } catch (error) {
      console.error('Failed to create Elasticsearch client:', error.message);
      this.available = false;
    }
    
    this._initialized = true;
  }

  get indices() {
    return {
      nft: 'nft_search',
      user: 'user_search',
      transaction: 'transaction_search',
    };
  }

  async initialize() {
    await this._ensureInitialized();
    
    if (!this.available || !this.client) {
      logger.warn('Elasticsearch not available - skipping initialization');
      return;
    }
    
    try {
      await this.client.ping();
      logger.info('Elasticsearch connected successfully');

      await this.createNFTIndex();
      await this.createUserIndex();
      await this.createTransactionIndex();
    } catch (error) {
      logger.error('Elasticsearch connection failed:', error);
      throw error;
    }
  }

  async createNFTIndex() {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indices.nft,
      });

      if (indexExists) return;

      await this.client.indices.create({
        index: this.indices.nft,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'autocomplete_filter'],
                },
              },
              filter: {
                autocomplete_filter: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              contractAddress: { type: 'keyword' },
              tokenId: { type: 'keyword' },
              title: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                  },
                },
              },
              description: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              category: {
                type: 'keyword',
                fields: { text: { type: 'text' } },
              },
              collection: { type: 'keyword' },
              owner: { type: 'keyword' },
              creator: { type: 'keyword' },
              price: {
                type: 'double',
                fields: { integer: { type: 'long' } },
              },
              currency: { type: 'keyword' },
              floorPrice: { type: 'double' },
              attributes: {
                type: 'nested',
                properties: {
                  name: { type: 'keyword' },
                  value: { type: 'keyword' },
                  rarity: { type: 'double' },
                },
              },
              image: { type: 'keyword' },
              externalUrl: { type: 'keyword' },
              royalty: { type: 'double' },
              isListed: { type: 'boolean' },
              isSold: { type: 'boolean' },
              isFlagged: { type: 'boolean' },
              verificationStatus: { type: 'keyword' },
              views: { type: 'long' },
              favorites: { type: 'long' },
              sales: { type: 'long' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              listedAt: { type: 'date' },
              lastSalePrice: { type: 'double' },
              lastSaleDate: { type: 'date' },
              tags: { type: 'keyword' },
              rarity_score: { type: 'double' },
            },
          },
        },
      });

      logger.info('NFT index created successfully');
    } catch (error) {
      logger.error('Error creating NFT index:', error);
    }
  }

  async createUserIndex() {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indices.user,
      });

      if (indexExists) return;

      await this.client.indices.create({
        index: this.indices.user,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              username: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                  },
                },
              },
              email: { type: 'keyword' },
              displayName: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              walletAddress: { type: 'keyword' },
              bio: { type: 'text' },
              profileImage: { type: 'keyword' },
              isVerified: { type: 'boolean' },
              followers: { type: 'long' },
              following: { type: 'long' },
              totalSales: { type: 'double' },
              totalVolume: { type: 'double' },
              joinedAt: { type: 'date' },
              lastActive: { type: 'date' },
              reputation: { type: 'double' },
              nftsCreated: { type: 'long' },
              nftsOwned: { type: 'long' },
            },
          },
        },
      });

      logger.info('User index created successfully');
    } catch (error) {
      logger.error('Error creating user index:', error);
    }
  }

  async createTransactionIndex() {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indices.transaction,
      });

      if (indexExists) return;

      await this.client.indices.create({
        index: this.indices.transaction,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              transactionHash: { type: 'keyword' },
              nftId: { type: 'keyword' },
              seller: { type: 'keyword' },
              buyer: { type: 'keyword' },
              price: { type: 'double' },
              currency: { type: 'keyword' },
              type: { type: 'keyword' },
              status: { type: 'keyword' },
              timestamp: { type: 'date' },
              blockNumber: { type: 'long' },
            },
          },
        },
      });

      logger.info('Transaction index created successfully');
    } catch (error) {
      logger.error('Error creating transaction index:', error);
    }
  }

  async indexNFT(nftData) {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      await this.client.index({
        index: this.indices.nft,
        id: nftData.id,
        document: nftData,
      });
    } catch (error) {
      logger.error('Error indexing NFT:', error);
      throw error;
    }
  }

  async updateNFT(nftId, nftData) {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      await this.client.update({
        index: this.indices.nft,
        id: nftId,
        doc: nftData,
      });
    } catch (error) {
      logger.error('Error updating NFT index:', error);
      throw error;
    }
  }

  async deleteNFT(nftId) {
    await this._ensureInitialized();
    if (!this.available || !this.client) return;
    
    try {
      await this.client.delete({
        index: this.indices.nft,
        id: nftId,
      });
    } catch (error) {
      logger.error('Error deleting from NFT index:', error);
    }
  }

  async search(query) {
    await this._ensureInitialized();
    if (!this.available || !this.client) {
      return { total: 0, hits: [], aggregations: {} };
    }
    
    try {
      const result = await this.client.search({
        index: this.indices.nft,
        body: query,
      });

      return {
        total: result.hits.total.value,
        hits: result.hits.hits.map((hit) => ({
          ...hit._source,
          _score: hit._score,
        })),
        aggregations: result.aggregations,
      };
    } catch (error) {
      logger.error('Error searching:', error);
      throw error;
    }
  }

  async suggest(prefix, field = 'title') {
    await this._ensureInitialized();
    if (!this.available || !this.client) return [];
    
    try {
      const result = await this.client.search({
        index: this.indices.nft,
        body: {
          suggest: {
            suggestions: {
              prefix,
              completion: {
                field: `${field}.autocomplete`,
                size: 10,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      return result.suggest.suggestions[0].options.map((opt) => ({
        text: opt.text,
        score: opt._score,
      }));
    } catch (error) {
      logger.error('Error getting suggestions:', error);
      return [];
    }
  }

  async close() {
    await this._ensureInitialized();
    if (this.available && this.client) {
      await this.client.close();
    }
  }
}

const elasticsearchClientInstance = new ElasticsearchClient();
export default elasticsearchClientInstance;
