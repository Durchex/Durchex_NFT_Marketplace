// Mobile Marketplace Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  SearchBar,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const MarketplaceScreen = ({ navigation }) => {
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterOpen, setFilterOpen] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load NFTs
  const loadNFTs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/nft/marketplace`, {
        params: {
          sort: sortBy,
          search: searchQuery,
          limit: 50,
        },
      });
      setNfts(response.data.nfts);
      setFilteredNfts(response.data.nfts);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchQuery]);

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNFTs();
    setRefreshing(false);
  }, [loadNFTs]);

  // Filter NFTs based on search
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = nfts.filter(
      (nft) =>
        nft.name.toLowerCase().includes(query.toLowerCase()) ||
        nft.collection.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredNfts(filtered);
  };

  // NFT card component
  const NFTCard = ({ item }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => navigation.navigate('Detail', { nft: item })}
    >
      <Image source={{ uri: item.image }} style={styles.nftImage} />
      
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.nftCollection} numberOfLines={1}>
          {item.collection}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price} ETH</Text>
          <View style={styles.rarity}>
            <MaterialCommunityIcons
              name="star"
              size={14}
              color="#FFD700"
            />
            <Text style={styles.rarityText}>{item.rarity}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('Detail', { nft: item })}
        >
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Sort menu component
  const SortMenu = () => (
    <View style={styles.sortMenu}>
      {['recent', 'price-low', 'price-high', 'trending'].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.sortOption,
            sortBy === option && styles.sortOptionActive,
          ]}
          onPress={() => {
            setSortBy(option);
            setFilterOpen(false);
          }}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === option && styles.sortOptionTextActive,
            ]}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity
          onPress={() => setFilterOpen(!filterOpen)}
          style={styles.sortBtn}
        >
          <MaterialCommunityIcons name="sort" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <Text
          style={styles.searchInput}
          placeholder="Search NFTs..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Sort Menu */}
      {filterOpen && <SortMenu />}

      {/* NFT List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <FlatList
          data={filteredNfts}
          renderItem={({ item }) => <NFTCard item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#667eea"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="image-search"
                size={48}
                color="#999"
              />
              <Text style={styles.emptyText}>No NFTs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  sortBtn: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  sortMenu: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#f0f0f0',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  nftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nftImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  nftCollection: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  rarity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rarityText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});

export default MarketplaceScreen;
