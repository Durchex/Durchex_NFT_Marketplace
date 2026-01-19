import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RentalDashboard.css';

const RentalDashboard = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [listingForm, setListingForm] = useState({
    dailyPrice: '',
    minDays: 1,
    maxDays: 30,
  });
  const [selectedBidData, setSelectedBidData] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidForm, setBidForm] = useState({
    rentalDays: 7,
  });

  // Fetch data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, myListingsRes, rentalsRes] = await Promise.all([
        axios.get('/api/rental/stats'),
        axios.get('/api/rental/my-listings'),
        axios.get('/api/rental/my-rentals'),
      ]);

      setStats(statsRes.data);
      setMyListings(myListingsRes.data);
      setActiveRentals(rentalsRes.data);

      // Simulate available listings (in production, fetch from database)
      setListings([
        {
          id: 1,
          tokenId: '123',
          dailyPrice: 0.5,
          minDays: 1,
          maxDays: 30,
          ownerReputation: 48,
          rentalCount: 25,
        },
        {
          id: 2,
          tokenId: '456',
          dailyPrice: 1.0,
          minDays: 3,
          maxDays: 60,
          ownerReputation: 42,
          rentalCount: 18,
        },
      ]);
    } catch (error) {
      console.error('Error fetching rental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rental/create-listing', listingForm);
      setShowCreateListing(false);
      setListingForm({ dailyPrice: '', minDays: 1, maxDays: 30 });
      fetchAllData();
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      const totalPrice = (selectedBidData.dailyPrice * bidForm.rentalDays).toFixed(4);
      await axios.post('/api/rental/place-bid', {
        listingId: selectedBidData.id,
        rentalDays: bidForm.rentalDays,
        totalPrice,
      });
      setShowBidForm(false);
      setBidForm({ rentalDays: 7 });
      fetchAllData();
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  const handleReturnNFT = async (rentalId) => {
    try {
      await axios.post(`/api/rental/return-nft/${rentalId}`);
      fetchAllData();
    } catch (error) {
      console.error('Error returning NFT:', error);
    }
  };

  const calculateRentalCost = (dailyPrice, days) => {
    return (dailyPrice * days).toFixed(4);
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  return (
    <div className="rental-dashboard">
      {/* Header */}
      <div className="rental-header">
        <h1>NFT Rental Marketplace</h1>
        <p>Rent NFTs or earn by renting out your collection</p>

        {/* Quick Stats */}
        <div className="rental-stats">
          <div className="stat-card">
            <span className="label">Active Listings</span>
            <span className="value">{stats?.totalListings || 0}</span>
          </div>
          <div className="stat-card">
            <span className="label">Active Rentals</span>
            <span className="value">{stats?.totalRentals || 0}</span>
          </div>
          <div className="stat-card">
            <span className="label">Pending Bids</span>
            <span className="value">{stats?.totalBids || 0}</span>
          </div>
          <div className="stat-card">
            <span className="label">Fees Collected</span>
            <span className="value">{(stats?.totalFeesCollected || 0).toFixed(2)} ETH</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rental-tabs">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Rentals
        </button>
        <button
          className={`tab-btn ${activeTab === 'myListings' ? 'active' : ''}`}
          onClick={() => setActiveTab('myListings')}
        >
          My Listings
        </button>
        <button
          className={`tab-btn ${activeTab === 'activeRentals' ? 'active' : ''}`}
          onClick={() => setActiveTab('activeRentals')}
        >
          Active Rentals
        </button>
      </div>

      {/* Content */}
      <div className="rental-content">
        {/* Available Rentals Tab */}
        {activeTab === 'available' && (
          <div className="available-section">
            <div className="section-header">
              <h2>Available NFTs for Rent</h2>
              <div className="filter-controls">
                <input
                  type="number"
                  placeholder="Max daily price..."
                  className="filter-input"
                />
                <select className="filter-select">
                  <option value="">Sort by</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading listings...</div>
            ) : listings.length > 0 ? (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <div key={listing.id} className="listing-card">
                    <div className="listing-header">
                      <h3>NFT #{listing.tokenId}</h3>
                      <span className="reputation-badge">
                        ⭐ {listing.ownerReputation}/50
                      </span>
                    </div>

                    <div className="listing-pricing">
                      <div className="price-info">
                        <span className="label">Daily Price</span>
                        <span className="price">{listing.dailyPrice} ETH</span>
                      </div>
                      <div className="duration-info">
                        <span className="label">Rental Period</span>
                        <span className="value">
                          {listing.minDays} - {listing.maxDays} days
                        </span>
                      </div>
                    </div>

                    <div className="listing-stats">
                      <span>👥 {listing.rentalCount} rentals</span>
                    </div>

                    <button
                      className="bid-btn"
                      onClick={() => {
                        setSelectedBidData(listing);
                        setShowBidForm(true);
                      }}
                    >
                      Make an Offer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-listings">
                <p>No rentals available at the moment</p>
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'myListings' && (
          <div className="my-listings-section">
            <div className="section-header">
              <h2>My Rental Listings</h2>
              <button
                className="create-listing-btn"
                onClick={() => setShowCreateListing(true)}
              >
                + Create Listing
              </button>
            </div>

            {myListings.length > 0 ? (
              <div className="my-listings-grid">
                {myListings.map((listing) => (
                  <div key={listing.id} className="my-listing-card">
                    <div className="card-header">
                      <h3>NFT #{listing.tokenId}</h3>
                      <span className={`status status-${listing.status}`}>
                        {listing.status}
                      </span>
                    </div>

                    <div className="card-content">
                      <div className="info-row">
                        <span className="label">Daily Price:</span>
                        <span className="value">{listing.dailyPrice} ETH</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Min Duration:</span>
                        <span className="value">{listing.minDays} days</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Max Duration:</span>
                        <span className="value">{listing.maxDays} days</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Total Earned:</span>
                        <span className="value">{listing.totalEarnings} ETH</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="action-btn edit">Edit</button>
                      <button className="action-btn remove">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-listings">
                <p>You haven't created any listings yet</p>
                <button
                  className="create-listing-btn"
                  onClick={() => setShowCreateListing(true)}
                >
                  Create Your First Listing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Rentals Tab */}
        {activeTab === 'activeRentals' && (
          <div className="active-rentals-section">
            <h2>Your Active Rentals</h2>

            {activeRentals.length > 0 ? (
              <div className="rentals-grid">
                {activeRentals.map((rental) => {
                  const daysLeft = getDaysRemaining(rental.endDate);
                  const onTime = daysLeft > 0;

                  return (
                    <div key={rental.rentalId} className="rental-card">
                      <div className="rental-header">
                        <h3>NFT #{rental.tokenId}</h3>
                        <span className={`status ${onTime ? 'on-time' : 'overdue'}`}>
                          {onTime ? '✓ On Time' : '⚠ Overdue'}
                        </span>
                      </div>

                      <div className="rental-details">
                        <div className="detail">
                          <span className="label">Owner:</span>
                          <span className="value">{rental.owner.slice(0, 10)}...</span>
                        </div>
                        <div className="detail">
                          <span className="label">Daily Price:</span>
                          <span className="value">{rental.dailyPrice} ETH</span>
                        </div>
                        <div className="detail">
                          <span className="label">Total Payment:</span>
                          <span className="value">{rental.totalPrice} ETH</span>
                        </div>
                      </div>

                      <div className="rental-timeline">
                        <span className="label">Time Remaining</span>
                        <div className="timeline-bar">
                          <div
                            className="timeline-fill"
                            style={{
                              width: `${Math.max(0, (daysLeft / 30) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="days-left">
                          {daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}
                        </span>
                      </div>

                      <button
                        className="return-btn"
                        onClick={() => handleReturnNFT(rental.rentalId)}
                      >
                        Return NFT
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-rentals">
                <p>You don't have any active rentals</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="modal-overlay" onClick={() => setShowCreateListing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Rental Listing</h3>

            <form onSubmit={handleCreateListing}>
              <div className="form-group">
                <label>Daily Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={listingForm.dailyPrice}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      dailyPrice: e.target.value,
                    })
                  }
                  placeholder="0.5"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Rental Days</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={listingForm.minDays}
                    onChange={(e) =>
                      setListingForm({
                        ...listingForm,
                        minDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Rental Days</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={listingForm.maxDays}
                    onChange={(e) =>
                      setListingForm({
                        ...listingForm,
                        maxDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Create Listing
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateListing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Form Modal */}
      {showBidForm && selectedBidData && (
        <div className="modal-overlay" onClick={() => setShowBidForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Place Rental Offer</h3>

            <div className="bid-summary">
              <p>NFT #{selectedBidData.tokenId}</p>
              <p>Daily Price: {selectedBidData.dailyPrice} ETH</p>
            </div>

            <form onSubmit={handlePlaceBid}>
              <div className="form-group">
                <label>Rental Duration (Days)</label>
                <input
                  type="number"
                  min={selectedBidData.minDays}
                  max={selectedBidData.maxDays}
                  required
                  value={bidForm.rentalDays}
                  onChange={(e) =>
                    setBidForm({
                      rentalDays: parseInt(e.target.value),
                    })
                  }
                />
                <small>
                  {selectedBidData.minDays} - {selectedBidData.maxDays} days allowed
                </small>
              </div>

              <div className="bid-calculation">
                <div className="calc-row">
                  <span>Daily Price:</span>
                  <span>{selectedBidData.dailyPrice} ETH</span>
                </div>
                <div className="calc-row">
                  <span>Duration:</span>
                  <span>{bidForm.rentalDays} days</span>
                </div>
                <div className="calc-row total">
                  <span>Total Cost:</span>
                  <span>
                    {calculateRentalCost(selectedBidData.dailyPrice, bidForm.rentalDays)} ETH
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Place Offer
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowBidForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalDashboard;
