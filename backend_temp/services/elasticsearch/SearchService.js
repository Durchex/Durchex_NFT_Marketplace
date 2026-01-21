import esClient from './ElasticsearchClient.js';
import logger from '../../utils/logger.js';

class SearchService {
  /**
   * Advanced NFT search with relevance ranking
   */
  async searchNFTs(params) {
    const {
      query = '',
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20,
      facets = [],
    } = params;

    const from = (page - 1) * limit;
    const must = [];
    const filter = [];
    const should = [];

    // Full-text search query
    if (query) {
      should.push({
        match: {
          title: {
            query,
            fuzziness: 'AUTO',
            boost: 3,
          },
        },
      });

      should.push({
        match: {
          description: {
            query,
            fuzziness: 'AUTO',
            boost: 1,
          },
        },
      });

      should.push({
        match_phrase: {
          title: {
            query,
            boost: 5,
          },
        },
      });
    } else {
      must.push({
        match_all: {},
      });
    }

    // Apply filters
    if (filters.category) {
      filter.push({
        term: {
          category: filters.category,
        },
      });
    }

    if (filters.collection) {
      filter.push({
        term: {
          collection: filters.collection,
        },
      });
    }

    if (filters.creator) {
      filter.push({
        term: {
          creator: filters.creator,
        },
      });
    }

    if (filters.priceMin || filters.priceMax) {
      const priceRange = {};
      if (filters.priceMin) priceRange.gte = filters.priceMin;
      if (filters.priceMax) priceRange.lte = filters.priceMax;
      filter.push({ range: { price: priceRange } });
    }

    if (filters.isListed !== undefined) {
      filter.push({ term: { isListed: filters.isListed } });
    }

    if (filters.verificationStatus) {
      filter.push({
        term: {
          verificationStatus: filters.verificationStatus,
        },
      });
    }

    if (filters.attributes && filters.attributes.length > 0) {
      filters.attributes.forEach((attr) => {
        filter.push({
          nested: {
            path: 'attributes',
            query: {
              bool: {
                must: [
                  { term: { 'attributes.name': attr.name } },
                  { term: { 'attributes.value': attr.value } },
                ],
              },
            },
          },
        });
      });
    }

    // Sorting
    let sortBy = [{ _score: { order: 'desc' } }];
    switch (sort) {
      case 'price_low':
        sortBy = [{ price: { order: 'asc' } }];
        break;
      case 'price_high':
        sortBy = [{ price: { order: 'desc' } }];
        break;
      case 'newest':
        sortBy = [{ createdAt: { order: 'desc' } }];
        break;
      case 'most_viewed':
        sortBy = [{ views: { order: 'desc' } }];
        break;
      case 'most_liked':
        sortBy = [{ favorites: { order: 'desc' } }];
        break;
      case 'trending':
        sortBy = [
          { sales: { order: 'desc' } },
          { _score: { order: 'desc' } },
        ];
        break;
      case 'rarity':
        sortBy = [{ rarity_score: { order: 'desc' } }];
        break;
    }

    // Build aggregations for facets
    const aggs = {};
    if (facets.includes('category')) {
      aggs.categories = {
        terms: { field: 'category', size: 10 },
      };
    }
    if (facets.includes('collection')) {
      aggs.collections = {
        terms: { field: 'collection', size: 10 },
      };
    }
    if (facets.includes('verificationStatus')) {
      aggs.verifications = {
        terms: { field: 'verificationStatus', size: 5 },
      };
    }
    if (facets.includes('priceRange')) {
      aggs.priceRanges = {
        range: {
          field: 'price',
          ranges: [
            { to: 1 },
            { from: 1, to: 5 },
            { from: 5, to: 10 },
            { from: 10, to: 50 },
            { from: 50, to: 100 },
            { from: 100 },
          ],
        },
      };
    }

    const searchQuery = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          should: should.length > 0 ? should : [],
          filter,
          minimum_should_match: should.length > 0 ? 1 : 0,
        },
      },
      sort: sortBy,
      from,
      size: limit,
    };

    if (Object.keys(aggs).length > 0) {
      searchQuery.aggs = aggs;
    }

    try {
      const results = await esClient.search(searchQuery);
      return this.formatSearchResults(results, page, limit);
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Autocomplete suggestions
   */
  async getAutocompleteSuggestions(prefix) {
    try {
      const suggestions = await esClient.suggest(prefix, 'title');
      return suggestions.slice(0, 10);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score with custom algorithm
   */
  calculateRelevanceScore(nft, query) {
    let score = 0;

    // Title match (highest weight)
    if (nft.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
      if (nft.title.toLowerCase() === query.toLowerCase()) {
        score += 25;
      }
    }

    // Description match
    if (nft.description && nft.description.toLowerCase().includes(query)) {
      score += 20;
    }

    // Popularity factors
    score += nft.views * 0.1;
    score += nft.favorites * 0.2;
    score += nft.sales * 0.3;

    // Verification boost
    if (nft.verificationStatus === 'verified') {
      score += 15;
    }

    // Recent listing boost
    const daysSinceListed = Math.floor(
      (Date.now() - new Date(nft.listedAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceListed < 7) {
      score += 10;
    } else if (daysSinceListed < 30) {
      score += 5;
    }

    return score;
  }

  /**
   * Get trending NFTs
   */
  async getTrendingNFTs(limit = 20) {
    const query = {
      query: {
        bool: {
          filter: [
            { range: { createdAt: { gte: 'now-7d' } } },
            { term: { isFlagged: false } },
          ],
        },
      },
      sort: [
        { sales: { order: 'desc' } },
        { views: { order: 'desc' } },
      ],
      size: limit,
    };

    try {
      const results = await esClient.search(query);
      return results.hits;
    } catch (error) {
      logger.error('Trending search error:', error);
      throw error;
    }
  }

  /**
   * Get similar NFTs
   */
  async getSimilarNFTs(nftId, limit = 10) {
    const query = {
      query: {
        more_like_this: {
          fields: ['title', 'description', 'category', 'attributes.value'],
          like: [{ _index: 'nft_search', _id: nftId }],
          min_term_freq: 1,
          max_query_terms: 12,
        },
      },
      size: limit,
    };

    try {
      const results = await esClient.search(query);
      return results.hits;
    } catch (error) {
      logger.error('Similar NFT search error:', error);
      throw error;
    }
  }

  /**
   * Search with multi-field boost
   */
  async advancedSearch(params) {
    const { query, fields = {}, limit = 20 } = params;

    const multiMatchQuery = {
      query: {
        multi_match: {
          query,
          fields: [
            'title^3',
            'description^2',
            'category^2',
            'tags^1.5',
            'collection',
          ],
          fuzziness: 'AUTO',
          operator: 'or',
          type: 'best_fields',
        },
      },
      size: limit,
    };

    try {
      const results = await esClient.search(multiMatchQuery);
      return results.hits;
    } catch (error) {
      logger.error('Advanced search error:', error);
      throw error;
    }
  }

  /**
   * Index NFT for search
   */
  async indexNFT(nftData) {
    try {
      await esClient.indexNFT({
        id: nftData._id.toString(),
        contractAddress: nftData.contractAddress,
        tokenId: nftData.tokenId,
        title: nftData.title,
        description: nftData.description,
        category: nftData.category,
        collection: nftData.collection || '',
        owner: nftData.owner?.toString() || '',
        creator: nftData.creator?.toString() || '',
        price: nftData.price || 0,
        currency: nftData.currency || 'ETH',
        floorPrice: nftData.floorPrice || 0,
        attributes: nftData.attributes || [],
        image: nftData.image,
        externalUrl: nftData.externalUrl || '',
        royalty: nftData.royalty || 0,
        isListed: nftData.isListed || false,
        isSold: nftData.isSold || false,
        isFlagged: nftData.isFlagged || false,
        verificationStatus: nftData.verificationStatus || 'unverified',
        views: nftData.views || 0,
        favorites: nftData.favorites || 0,
        sales: nftData.sales || 0,
        createdAt: nftData.createdAt || new Date(),
        updatedAt: nftData.updatedAt || new Date(),
        listedAt: nftData.listedAt || new Date(),
        lastSalePrice: nftData.lastSalePrice || 0,
        lastSaleDate: nftData.lastSaleDate,
        tags: nftData.tags || [],
        rarity_score: this.calculateRarityScore(nftData.attributes || []),
      });

      logger.info(`NFT ${nftData._id} indexed for search`);
    } catch (error) {
      logger.error('Error indexing NFT for search:', error);
    }
  }

  /**
   * Calculate rarity score based on attributes
   */
  calculateRarityScore(attributes) {
    if (!attributes || attributes.length === 0) return 0;
    return attributes.reduce((sum, attr) => sum + (attr.rarity || 0), 0) /
      attributes.length >
      0.8
      ? 1
      : 0;
  }

  /**
   * Format search results with pagination
   */
  formatSearchResults(results, page, limit) {
    return {
      total: results.total,
      pages: Math.ceil(results.total / limit),
      currentPage: page,
      perPage: limit,
      items: results.hits,
      facets: results.aggregations || {},
    };
  }
}

const searchServiceInstance = new SearchService();
export default searchServiceInstance;
