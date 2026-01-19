// Mobile Wallet Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileWalletService from '../../services/MobileWalletService';
import axios from 'axios';

const WalletScreen = ({ navigation }) => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('assets');
  const [walletService] = useState(() => new MobileWalletService());

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Initialize wallet on mount
  useEffect(() => {
    initializeWallet();
  }, []);

  // Initialize wallet
  const initializeWallet = useCallback(async () => {
    try {
      setLoading(true);
      
      // Restore or connect wallet
      let wallet = await walletService.restoreConnection();
      
      if (!wallet) {
        wallet = await walletService.connectWallet();
      }

      setWalletInfo(wallet);

      // Load wallet data
      await Promise.all([
        loadBalance(wallet.address),
        loadNFTs(wallet.address),
        loadTransactions(wallet.address),
      ]);
    } catch (error) {
      console.error('Wallet initialization failed:', error);
    } finally {
      setLoading(false);
    }
  }, [walletService]);

  // Load balance
  const loadBalance = useCallback(async (address) => {
    try {
      const balanceWei = await walletService.getBalance();
      const balanceEth = MobileWalletService.formatValue(balanceWei);
      setBalance(balanceEth);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, [walletService]);

  // Load NFTs
  const loadNFTs = useCallback(async (address) => {
    try {
      const response = await axios.get(`${API_URL}/user/nfts/${address}`);
      setNfts(response.data.nfts || []);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (address) => {
    try {
      const response = await axios.get(`${API_URL}/user/transactions/${address}`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (walletInfo) {
      await Promise.all([
        loadBalance(walletInfo.address),
        loadNFTs(walletInfo.address),
        loadTransactions(walletInfo.address),
      ]);
    }
    setRefreshing(false);
  }, [walletInfo, loadBalance, loadNFTs, loadTransactions]);

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      await walletService.disconnectWallet();
      setWalletInfo(null);
      setBalance('0');
      setNfts([]);
      setTransactions([]);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // NFT Card
  const NFTCard = ({ item }) => (
    <TouchableOpacity style={styles.nftCard}>
      <Image source={{ uri: item.image }} style={styles.nftImage} />
      <View style={styles.nftOverlay}>
        <Text style={styles.nftName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Transaction Card
  const TransactionCard = ({ item }) => (
    <View style={styles.txCard}>
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIcon,
            {
              backgroundColor:
                item.type === 'send' ? '#ffebee' : '#e8f5e9',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.type === 'send' ? 'arrow-top-right' : 'arrow-bottom-left'}
            size={20}
            color={item.type === 'send' ? '#f44336' : '#4caf50'}
          />
        </View>
        <View>
          <Text style={styles.txType}>{item.type}</Text>
          <Text style={styles.txDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            {
              color: item.type === 'send' ? '#f44336' : '#4caf50',
            },
          ]}
        >
          {item.type === 'send' ? '-' : '+'}
          {item.amount}
        </Text>
        <View
          style={[
            styles.txStatus,
            {
              backgroundColor:
                item.status === 'confirmed' ? '#e8f5e9' : '#fff3e0',
            },
          ]}
        >
          <Text
            style={[
              styles.txStatusText,
              {
                color:
                  item.status === 'confirmed' ? '#4caf50' : '#ff9800',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
          />
        }
      >
        {walletInfo ? (
          <>
            {/* Wallet Header */}
            <View style={styles.walletHeader}>
              <View style={styles.walletCard}>
                <View style={styles.walletTop}>
                  <Text style={styles.label}>Total Balance</Text>
                  <TouchableOpacity
                    style={styles.disconnectBtn}
                    onPress={handleDisconnect}
                  >
                    <MaterialCommunityIcons
                      name="logout"
                      size={20}
                      color="#f44336"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.balanceValue}>{balance} ETH</Text>

                <Text style={styles.address}>
                  {MobileWalletService.formatAddress(walletInfo.address)}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.sendBtn]}
                    onPress={() => navigation.navigate('Bridge')}
                  >
                    <MaterialCommunityIcons name="send" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Send</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.receiveBtn]}
                    onPress={() => navigation.navigate('Staking')}
                  >
                    <MaterialCommunityIcons name="download" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Stake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.bridgeBtn]}
                    onPress={() => navigation.navigate('Bridge')}
                  >
                    <MaterialCommunityIcons name="shuffle" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Bridge</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              {['assets', 'activity'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {activeTab === 'assets' ? (
                <>
                  <Text style={styles.sectionTitle}>NFTs ({nfts.length})</Text>
                  {nfts.length > 0 ? (
                    <FlatList
                      data={nfts}
                      renderItem={({ item }) => <NFTCard item={item} />}
                      keyExtractor={(item) => item.id}
                      numColumns={3}
                      scrollEnabled={false}
                      columnWrapperStyle={styles.nftRow}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="image-off"
                        size={48}
                        color="#ddd"
                      />
                      <Text style={styles.emptyText}>No NFTs</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>
                    Recent Activity ({transactions.length})
                  </Text>
                  {transactions.length > 0 ? (
                    <FlatList
                      data={transactions}
                      renderItem={({ item }) => (
                        <TransactionCard item={item} />
                      )}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="history"
                        size={48}
                        color="#ddd"
                      />
                      <Text style={styles.emptyText}>No transactions</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="wallet-alert"
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyTitle}>No Wallet Connected</Text>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={initializeWallet}
            >
              <Text style={styles.connectBtnText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  walletCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  disconnectBtn: {
    padding: 8,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  sendBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  receiveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bridgeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#667eea',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  nftRow: {
    gap: 12,
    marginBottom: 12,
  },
  nftCard: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    aspectRatio: 1,
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  nftOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  nftName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  txCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  txDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  txStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  connectBtn: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  connectBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WalletScreen;
