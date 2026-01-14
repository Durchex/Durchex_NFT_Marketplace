import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiCopy, FiCheck, FiHeart, FiShare2, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { Edit3 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { nftAPI, userAPI, engagementAPI, offerAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ICOContent } from '../Context';
import NFTImageHoverOverlay from '../components/NFTImageHoverOverlay';
import CoverPhotoUploader from '../components/CoverPhotoUploader';
import ListingRequestForm from '../components/ListingRequestForm';

const CreatorProfile = () => {
  const { walletAddress } = useParams();
  const navigate = useNavigate();
  const { address: userWalletAddress } = useContext(ICOContent) || {};
  const [creator, setCreator] = useState(null);
  const [creatorNFTs, setCreatorNFTs] = useState([]);
  const [creatorCollections, setCreatorCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState('nfts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [cartItems, setCartItems] = useState(new Set());
  const [likedItems, setLikedItems] = useState(new Set());
  const [coverPhotoOpen, setCoverPhotoOpen] = useState(false);
  const [listingRequestOpen, setListingRequestOpen] = useState(false);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchCreatorProfile();
    fetchCreatorCollections();
    if (userWalletAddress) {
      checkFollowStatus();
      loadFollowerCount();
      // Only fetch offers and orders if viewing own profile
      if (userWalletAddress?.toLowerCase() === walletAddress?.toLowerCase()) {
        fetchReceivedOffers();
        fetchSellerOrders();
      }
    }
  }, [walletAddress, userWalletAddress]);

  const fetchCreatorProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const userProfile = await userAPI.getUserProfile(walletAddress);
      
      if (userProfile) {
        setCreator(userProfile);
      } else {
        // If no user profile, create minimal creator data from address
        setCreator({
          walletAddress,
          username: `Creator ${walletAddress.slice(0, 6)}`,
          image: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
          bio: 'Creator on Durchex',
          email: null
        });
      }

      // Fetch all NFTs from all networks and filter by this creator
      let allNFTs = [];
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      
      for (const network of networks) {
        try {
          const networkNfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(networkNfts)) {
            // Filter for NFTs where owner/seller matches this creator
            const creatorNfts = networkNfts.filter(
              nft => (nft.owner?.toLowerCase() === walletAddress?.toLowerCase() || 
                      nft.seller?.toLowerCase() === walletAddress?.toLowerCase() ||
                      nft.creator?.toLowerCase() === walletAddress?.toLowerCase())
            );
            allNFTs = [...allNFTs, ...creatorNfts];
          }
        } catch (err) {
          console.warn(`Error fetching NFTs from ${network}:`, err.message);
        }
      }

      // Sort by creation date (newest first)
      allNFTs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setCreatorNFTs(allNFTs);
      console.log(`[CreatorProfile] Found ${allNFTs.length} NFTs for creator ${walletAddress}`);
    } catch (error) {
      console.error('[CreatorProfile] Error fetching profile:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreatorCollections = async () => {
    try {
      // Fetch collections created by this creator
      const collections = await nftAPI.getUserCollections(walletAddress);
      setCreatorCollections(Array.isArray(collections) ? collections : []);
      console.log(`[CreatorProfile] Found ${collections.length} collections for creator ${walletAddress}`);
    } catch (error) {
      console.error('[CreatorProfile] Error fetching collections:', error);
      setCreatorCollections([]);
    }
  };

  const checkFollowStatus = async () => {
    try {
      if (!userWalletAddress || userWalletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return; // Don't check if same user
      }
      const result = await engagementAPI.isFollowingCreator(walletAddress, userWalletAddress);
      setIsFollowing(result.following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const loadFollowerCount = async () => {
    try {
      const result = await engagementAPI.getCreatorFollowers(walletAddress, 1, 1);
      setFollowerCount(result.total || 0);
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!userWalletAddress) {
      toast.error('Please connect your wallet');
      return;
    }
    if (userWalletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      toast.error('Cannot follow yourself');
      return;
    }

    try {
      if (isFollowing) {
        await engagementAPI.unfollowCreator(walletAddress, userWalletAddress);
        toast.success('Unfollowed');
        setFollowerCount(prev => prev - 1);
      } else {
        await engagementAPI.followCreator(walletAddress, userWalletAddress, creator.username);
        toast.success('Followed!');
        setFollowerCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
      if (error.response?.status === 409) {
        toast.error('Already following this creator');
      } else {
        toast.error('Failed to toggle follow');
      }
    }
  };

  const handleShareProfile = async () => {
    try {
      const shareUrl = `${window.location.origin}/creator/${walletAddress}`;
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${creator.username}`,
          text: `Explore ${creator.username}'s NFTs on Durchex`,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const fetchReceivedOffers = async () => {
    if (!userWalletAddress || userWalletAddress.toLowerCase() !== walletAddress.toLowerCase()) return;
    
    setOffersLoading(true);
    try {
      const offers = await offerAPI.getReceivedOffers(walletAddress);
      setReceivedOffers(offers);
    } catch (error) {
      console.error('Error fetching received offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setOffersLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    if (!userWalletAddress || userWalletAddress.toLowerCase() !== walletAddress.toLowerCase()) return;
    
    setOrdersLoading(true);
    try {
      const orders = await orderAPI.getSellerOrders(walletAddress);
      setSellerOrders(orders);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading creator profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Creator not found</p>
            <button
              onClick={() => navigate('/')}
              className="text-purple-500 hover:text-purple-400"
            >
              Return to home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Creator Header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 mb-12 border border-purple-800/50">
          {/* Cover Photo Section */}
          <div className="relative -m-8 mb-6 -mx-8 h-40 bg-gray-800 rounded-t-2xl overflow-hidden group">
            {creator?.coverPhoto ? (
              <img
                src={creator.coverPhoto}
                alt="Cover Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-900 to-pink-900" />
            )}
            {userWalletAddress?.toLowerCase() === walletAddress?.toLowerCase() && (
              <button
                onClick={() => setCoverPhotoOpen(true)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit cover photo"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={creator.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`}
                alt={creator.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`;
                }}
              />
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{creator.username}</h1>
              
              {creator.bio && (
                <p className="text-gray-300 mb-4">{creator.bio}</p>
              )}

              {/* Wallet Address */}
              <div className="flex items-center gap-2 mb-6 bg-gray-900/50 px-4 py-2 rounded-lg w-fit">
                <code className="text-sm text-gray-400">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="text-gray-400 hover:text-white transition"
                  title="Copy full address"
                >
                  {copiedAddress ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>

              {/* Email if available */}
              {creator.email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <FiMail size={18} />
                  <a href={`mailto:${creator.email}`} className="hover:text-white transition">
                    {creator.email}
                  </a>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-purple-400">{creatorNFTs.length}</div>
                  <div className="text-gray-400 text-sm">NFTs Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {creatorNFTs.filter(nft => nft.currentlyListed).length}
                  </div>
                  <div className="text-gray-400 text-sm">Listed NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{creatorCollections.length}</div>
                  <div className="text-gray-400 text-sm">Collections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{followerCount}</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
              </div>

              {/* Follow and Share Buttons */}
              <div className="flex gap-3 mt-6">
                {userWalletAddress && userWalletAddress.toLowerCase() !== walletAddress.toLowerCase() && (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${
                        isFollowing
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <FiUserMinus size={18} />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <FiUserPlus size={18} />
                          Follow
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleShareProfile}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    >
                      <FiShare2 size={18} />
                      Share
                    </button>
                    {userWalletAddress && (
                      <button
                        onClick={() => setListingRequestOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                        title="Request creator to list your NFT on their platform"
                      >
                        Request Listing
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('nfts')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'nfts'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All NFTs ({creatorNFTs.length})
          </button>
          <button
            onClick={() => setActiveTab('listed')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'listed'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Listed ({creatorNFTs.filter(nft => nft.currentlyListed).length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'collections'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Collections ({creatorCollections.length})
          </button>
          {userWalletAddress?.toLowerCase() === walletAddress?.toLowerCase() && (
            <>
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === 'offers'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Offers ({receivedOffers.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === 'orders'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Orders ({sellerOrders.length})
              </button>
            </>
          )}
        </div>

        {/* NFTs/Collections Grid */}
        <div>
          {activeTab === 'collections' ? (
            // Collections Tab
            creatorCollections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No collections created yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creatorCollections.map((collection, index) => (
                  <Link
                    key={collection._id || index}
                    to={`/collection/${collection._id}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                      {/* Collection Image */}
                      <div className="relative w-full aspect-video overflow-hidden bg-gray-800">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Collection Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1 truncate group-hover:text-purple-400 transition">
                          {collection.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {collection.description || 'Collection'}
                        </p>
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-500">
                            {collection.nftCount || 0} items
                          </span>
                          <span className="text-purple-400 text-xs px-2 py-1 bg-purple-900/30 rounded">
                            {collection.network || 'ethereum'}
                          </span>
                        </div>
                        {collection.floorPrice && (
                          <div className="text-sm text-purple-300 font-semibold">
                            Floor: {collection.floorPrice} ETH
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            // NFTs Tab
            creatorNFTs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">
                  {activeTab === 'nfts' 
                    ? 'No NFTs created yet' 
                    : 'No NFTs listed yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(activeTab === 'listed' 
                  ? creatorNFTs.filter(nft => nft.currentlyListed)
                  : creatorNFTs
                ).map((nft, index) => (
                  <Link
                    key={nft._id || index}
                    to={`/nft/${nft.itemId}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                      {/* NFT Image */}
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-800">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        
                        {/* Hover Overlay */}
                        <NFTImageHoverOverlay
                          nft={{
                            ...nft,
                            price: nft.price || '0',
                            currency: 'ETH'
                          }}
                          isInCart={cartItems.has(nft.itemId)}
                          isLiked={likedItems.has(nft.itemId)}
                          onAddToCart={() => {
                            const newCart = new Set(cartItems);
                            if (newCart.has(nft.itemId)) {
                              newCart.delete(nft.itemId);
                              toast.success('Removed from cart');
                            } else {
                              newCart.add(nft.itemId);
                              toast.success('Added to cart!');
                            }
                            setCartItems(newCart);
                          }}
                          onLike={() => {
                            const newLiked = new Set(likedItems);
                            if (newLiked.has(nft.itemId)) {
                              newLiked.delete(nft.itemId);
                            } else {
                              newLiked.add(nft.itemId);
                            }
                            setLikedItems(newLiked);
                            if (userWalletAddress) {
                              engagementAPI.likeNFT(nft._id, nft.itemId, nft.contractAddress || nft.creator, nft.network || 'ethereum', userWalletAddress).catch(err => {
                                if (err.response?.status === 409) {
                                  console.log('Already liked');
                                }
                              });
                            }
                          }}
                        />
                        
                        {/* Listed Badge */}
                        {nft.currentlyListed && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                            Listed
                          </div>
                        )}
                      </div>

                      {/* NFT Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1 truncate group-hover:text-purple-400 transition">
                          {nft.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 truncate">
                          {nft.collection || 'Collection'}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {nft.price ? `${(parseFloat(nft.price) / 1e18).toFixed(4)} ETH` : 'N/A'}
                          </span>
                          <span className="text-purple-400">View →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Received Offers</h2>
              {offersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading offers...</p>
                </div>
              ) : receivedOffers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No offers received yet</p>
                  <p className="text-sm text-gray-500">Offers on your NFTs will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedOffers.map((offer) => (
                    <OfferCard 
                      key={offer.offerId} 
                      offer={offer} 
                      onAction={fetchReceivedOffers}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Sales Orders</h2>
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading orders...</p>
                </div>
              ) : sellerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No orders yet</p>
                  <p className="text-sm text-gray-500">Completed sales will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerOrders.map((order) => (
                    <OrderCard 
                      key={order.orderId} 
                      order={order} 
                      onAction={fetchSellerOrders}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Cover Photo Uploader Modal */}
      <CoverPhotoUploader 
        isOpen={coverPhotoOpen} 
        onClose={() => setCoverPhotoOpen(false)} 
        type="user" 
        entityId={walletAddress}
        onSuccess={() => {
          setCoverPhotoOpen(false);
          // Refetch profile to show updated cover photo
          if (walletAddress) {
            userAPI.getUserProfile(walletAddress).then((data) => {
              setCreator((prev) => ({
                ...prev,
                coverPhoto: data.coverPhoto || ""
              }));
            });
          }
        }}
      />

      {/* Listing Request Form Modal */}
      <ListingRequestForm 
        isOpen={listingRequestOpen} 
        onClose={() => setListingRequestOpen(false)} 
        creatorAddress={walletAddress}
        userNFTs={creatorNFTs}
      />
    </div>
  );
};

// Offer Card Component
const OfferCard = ({ offer, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await offerAPI.acceptOffer(offer.offerId);
      toast.success('Offer accepted! Please wait for payment confirmation.');
      onAction();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    setLoading(true);
    try {
      await offerAPI.rejectOffer(offer.offerId, reason);
      toast.success('Offer rejected');
      onAction();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Failed to reject offer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-start gap-4">
        {/* NFT Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          <img
            src={offer.nft?.image || '/placeholder-nft.png'}
            alt={offer.nft?.name || 'NFT'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-nft.png';
            }}
          />
        </div>

        {/* Offer Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white">{offer.nft?.name || 'Unknown NFT'}</h3>
              <p className="text-sm text-gray-400">From: {offer.offerer?.slice(0, 6)}...{offer.offerer?.slice(-4)}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">
                {(parseFloat(offer.offerPrice) / 1e18).toFixed(4)} ETH
              </div>
              <div className="text-xs text-gray-500 capitalize">{offer.network}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span>Expires: {formatDate(offer.expiresAt)}</span>
            <span>Status: <span className="text-yellow-400 capitalize">{offer.status}</span></span>
          </div>

          {/* Action Buttons */}
          {offer.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Accept Offer'}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}

          {offer.status === 'accepted' && (
            <div className="text-green-400 font-semibold">
              ✓ Offer accepted - Waiting for payment
            </div>
          )}

          {offer.status === 'rejected' && (
            <div className="text-red-400 font-semibold">
              ✗ Offer rejected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    const txHash = prompt('Enter transaction hash:');
    if (!txHash) return;

    setLoading(true);
    try {
      await orderAPI.confirmPayment(order.orderId, txHash, 'completed');
      toast.success('Payment confirmed! NFT transfer initiated.');
      onAction();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;

    setLoading(true);
    try {
      await orderAPI.cancelOrder(order.orderId, reason);
      toast.success('Order cancelled');
      onAction();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-start gap-4">
        {/* NFT Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          <img
            src={order.nft?.image || '/placeholder-nft.png'}
            alt={order.nft?.name || 'NFT'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-nft.png';
            }}
          />
        </div>

        {/* Order Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white">{order.nft?.name || 'Unknown NFT'}</h3>
              <p className="text-sm text-gray-400">Buyer: {order.buyer?.slice(0, 6)}...{order.buyer?.slice(-4)}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">
                {(parseFloat(order.price) / 1e18).toFixed(4)} ETH
              </div>
              <div className="text-xs text-gray-500 capitalize">{order.network}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span>Order ID: {order.orderId}</span>
            <span>Created: {formatDate(order.createdAt)}</span>
            <span>Status: <span className={`capitalize ${
              order.status === 'completed' ? 'text-green-400' :
              order.status === 'pending' ? 'text-yellow-400' :
              order.status === 'cancelled' ? 'text-red-400' : 'text-gray-400'
            }`}>{order.status}</span></span>
          </div>

          {/* Transaction Hash */}
          {order.transactionHash && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Transaction Hash:</p>
              <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                {order.transactionHash.slice(0, 10)}...{order.transactionHash.slice(-8)}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          {order.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Cancel Order'}
              </button>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="text-green-400 font-semibold">
              ✓ Payment confirmed - NFT transferred
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="text-red-400 font-semibold">
              ✗ Order cancelled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
