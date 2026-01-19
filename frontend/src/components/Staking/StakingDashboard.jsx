import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StakingDashboard.css';

const StakingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stakerInfo, setStakerInfo] = useState(null);
  const [userTier, setUserTier] = useState(null);
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [projections, setProjections] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [stakerRes, tierRes, statsRes, tiersRes, earningsRes, leaderRes, projRes] =
        await Promise.all([
          axios.get('/api/staking/my-info'),
          axios.get('/api/staking/my-tier'),
          axios.get('/api/staking/stats'),
          axios.get('/api/staking/tiers'),
          axios.get('/api/staking/earnings'),
          axios.get('/api/staking/leaderboard'),
          axios.get('/api/staking/projections'),
        ]);

      setStakerInfo(stakerRes.data);
      setUserTier(tierRes.data);
      setStats(statsRes.data);
      setTiers(tiersRes.data);
      setEarnings(earningsRes.data);
      setLeaderboard(leaderRes.data);
      setProjections(projRes.data);
    } catch (error) {
      console.error('Error fetching staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      await axios.post('/api/staking/claim-rewards');
      fetchAllData();
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  if (loading && !stakerInfo) {
    return <div className="staking-loading">Loading staking data...</div>;
  }

  return (
    <div className="staking-dashboard">
      {/* Header */}
      <div className="staking-header">
        <h1>NFT Staking Dashboard</h1>
        <p>Earn rewards by staking your NFTs</p>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat">
            <span className="label">Staked NFTs</span>
            <span className="value">{stakerInfo?.stakedCount || 0}</span>
          </div>
          <div className="stat">
            <span className="label">Your Tier</span>
            <span className={`tier-badge tier-${userTier?.tier.toLowerCase()}`}>
              {userTier?.tier}
            </span>
          </div>
          <div className="stat">
            <span className="label">Pending Rewards</span>
            <span className="value">{parseFloat(stakerInfo?.pendingRewards || 0).toFixed(4)} ETH</span>
          </div>
          <div className="stat">
            <span className="label">Total Earned</span>
            <span className="value">{parseFloat(stakerInfo?.totalRewards || 0).toFixed(4)} ETH</span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          className="claim-btn"
          onClick={handleClaimRewards}
          disabled={parseFloat(stakerInfo?.pendingRewards || 0) === 0}
        >
          💰 Claim Rewards
        </button>
      </div>

      {/* Tabs */}
      <div className="staking-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          Tiers & Benefits
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'projections' ? 'active' : ''}`}
          onClick={() => setActiveTab('projections')}
        >
          Earnings Projection
        </button>
      </div>

      {/* Content */}
      <div className="staking-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Tier Progress */}
            <div className="tier-progress">
              <h3>Your Tier Progress</h3>
              <div className="progress-card">
                <div className="tier-info">
                  <h4>{userTier?.tier}</h4>
                  <p>
                    {userTier?.stakedCount} / {userTier?.nextTierRequires || 'Max'} NFTs
                  </p>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(userTier?.stakedCount / (userTier?.nextTierRequires || 25)) * 100}%`,
                    }}
                  ></div>
                </div>

                <div className="boost-info">
                  <span className="label">APY Boost</span>
                  <span className="value">+{userTier?.boostPercentage}%</span>
                </div>
              </div>

              {userTier?.nextTierRequires && (
                <p className="next-tier">
                  Stake {userTier.nextTierRequires - userTier.stakedCount} more NFTs to reach next tier
                </p>
              )}
            </div>

            {/* Earnings Overview */}
            <div className="earnings-overview">
              <h3>Earnings Overview</h3>
              <div className="earnings-grid">
                <div className="earnings-card">
                  <span className="label">Daily Earnings</span>
                  <span className="value">{earnings?.boostedDaily || '0.0000'} ETH</span>
                  <span className="subtitle">with tier boost</span>
                </div>

                <div className="earnings-card">
                  <span className="label">Monthly Earnings</span>
                  <span className="value">{earnings?.monthly || '0.0000'} ETH</span>
                </div>

                <div className="earnings-card">
                  <span className="label">Annual Earnings</span>
                  <span className="value">{earnings?.yearly || '0.0000'} ETH</span>
                </div>

                <div className="earnings-card">
                  <span className="label">Total Claimed</span>
                  <span className="value">{parseFloat(stakerInfo?.claimedRewards || 0).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            {/* Staked NFTs */}
            <div className="staked-nfts">
              <h3>Your Staked NFTs</h3>
              <div className="nfts-grid">
                {stakerInfo?.stakedTokens && stakerInfo.stakedTokens.length > 0 ? (
                  stakerInfo.stakedTokens.map((tokenId) => (
                    <div key={tokenId} className="nft-card-mini">
                      <div className="nft-id">#{tokenId}</div>
                      <div className="nft-earning">Earning rewards...</div>
                    </div>
                  ))
                ) : (
                  <p className="no-nfts">No NFTs staked yet. Start staking to earn rewards!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="tiers-section">
            <h3>Staking Tiers</h3>
            <div className="tiers-grid">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`tier-card ${userTier?.tier === tier.name ? 'active' : ''}`}
                >
                  <div className="tier-header">
                    <span
                      className="tier-color"
                      style={{ backgroundColor: tier.color }}
                    ></span>
                    <h4>{tier.name}</h4>
                  </div>

                  <div className="tier-requirements">
                    <span className="label">Minimum</span>
                    <span className="value">{tier.minTokens} NFTs</span>
                  </div>

                  <div className="tier-boost">
                    <span className="label">APY Boost</span>
                    <span className="value">+{tier.boostPercentage}%</span>
                  </div>

                  <div className="tier-benefits">
                    <h5>Benefits:</h5>
                    <ul>
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>

                  {userTier?.tier === tier.name && (
                    <div className="current-tier-badge">Current Tier</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h3>Top Stakers</h3>
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="col rank">Rank</div>
                <div className="col address">Address</div>
                <div className="col staked">Staked NFTs</div>
                <div className="col rewards">Total Rewards</div>
                <div className="col tier">Tier</div>
              </div>

              {leaderboard.map((staker) => (
                <div key={staker.rank} className="table-row">
                  <div className="col rank">
                    <span className={`badge rank-${staker.rank}`}>#{staker.rank}</span>
                  </div>
                  <div className="col address">{staker.address}</div>
                  <div className="col staked">{staker.stakedCount}</div>
                  <div className="col rewards">{staker.totalRewards.toFixed(2)} ETH</div>
                  <div className="col tier">
                    <span className={`tier-badge tier-${staker.tier.toLowerCase()}`}>
                      {staker.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projections Tab */}
        {activeTab === 'projections' && (
          <div className="projections-section">
            <h3>12-Month Earnings Projection</h3>
            <div className="projection-chart">
              <div className="chart-bars">
                {projections.slice(0, 12).map((proj) => (
                  <div key={proj.month} className="bar-item">
                    <div
                      className="bar"
                      style={{
                        height: `${(parseFloat(proj.projected) / 50) * 100}%`,
                      }}
                      title={`${proj.projected} ETH`}
                    ></div>
                    <span className="label">Mo {proj.month}</span>
                    <span className="value">{parseFloat(proj.projected).toFixed(2)} ETH</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="projection-info">
              <p>
                Based on current staking amount and tier boost, you can expect to earn{' '}
                <strong>{earnings?.yearly} ETH</strong> annually
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="staking-footer">
        <div className="footer-stat">
          <span className="label">Total Staked NFTs</span>
          <span className="value">{stats?.totalStakedNFTs || 0}</span>
        </div>
        <div className="footer-stat">
          <span className="label">Active Stakers</span>
          <span className="value">{stats?.activeStakers || 0}</span>
        </div>
        <div className="footer-stat">
          <span className="label">Rewards Distributed</span>
          <span className="value">{(stats?.totalDistributedRewards || 0).toFixed(2)} ETH</span>
        </div>
        <div className="footer-stat">
          <span className="label">Reward Pool</span>
          <span className="value">{(stats?.rewardPoolBalance || 0).toFixed(2)} ETH</span>
        </div>
      </div>
    </div>
  );
};

export default StakingDashboard;
