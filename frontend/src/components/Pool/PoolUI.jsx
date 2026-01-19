import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2
} from 'lucide-react';
import './PoolUI.css';

/**
 * PoolUI - Liquidity Pool Management Interface
 * Features:
 * - Pool discovery and management
 * - Liquidity provision UI
 * - Swap interface
 * - Analytics and rewards
 * - Position tracking
 */
const PoolUI = ({ userAddress, userBalance = 0 }) => {
  // ========== State ==========
  const [pools, setPools] = useState([]);
  const [userPositions, setUserPositions] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [swapData, setSwapData] = useState({
    tokenIn: '',
    amountIn: '',
    tokenOut: '',
    amountOut: ''
  });
  const [liquidityData, setLiquidityData] = useState({
    amount0: '',
    amount1: ''
  });
  const [rewards, setRewards] = useState({
    totalRewards: 0,
    claimable: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [priceImpact, setPriceImpact] = useState('0');
  const [slippage, setSlippage] = useState('0.5');

  // ========== Effects ==========

  useEffect(() => {
    loadPools();
    if (userAddress) {
      loadUserPositions();
      loadRewards();
    }
  }, [userAddress]);

  // ========== API Calls ==========

  const loadPools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/pool');
      const data = await response.json();
      if (data.success) {
        setPools(data.data);
      }
    } catch (error) {
      console.error('Failed to load pools:', error);
      setError('Failed to load pools');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPositions = async () => {
    try {
      const response = await fetch('/api/v1/pool/user/liquidity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserPositions(data.data.positions);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const response = await fetch('/api/v1/pool/user/rewards', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRewards({
          totalRewards: parseFloat(data.data.total),
          claimable: data.data.rewards
        });
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

  const getSwapQuote = async (poolId, tokenIn, amountIn) => {
    if (!amountIn || amountIn === '0') {
      setSwapData(prev => ({ ...prev, amountOut: '' }));
      return;
    }

    try {
      const response = await fetch(`/api/v1/pool/${poolId}/swap-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokenIn,
          amountIn: parseFloat(amountIn)
        })
      });
      const data = await response.json();
      if (data.success) {
        setSwapData(prev => ({
          ...prev,
          amountOut: data.data.amountOut
        }));
        setPriceImpact(data.data.priceImpact || '0');
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
    }
  };

  // ========== Handlers ==========

  const handleSwap = async () => {
    if (!selectedPool || !swapData.tokenIn || !swapData.amountIn) {
      setError('Please fill in all swap details');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/pool/${selectedPool.id}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tokenIn: swapData.tokenIn,
          amountIn: parseFloat(swapData.amountIn)
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Swapped ${swapData.amountIn} for ${data.data.amountOut}`);
        setSwapData({ tokenIn: '', amountIn: '', tokenOut: '', amountOut: '' });
        setPriceImpact('0');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Swap failed');
      }
    } catch (error) {
      setError('Swap execution failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!selectedPool || !liquidityData.amount0 || !liquidityData.amount1) {
      setError('Please fill in both amounts');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/pool/${selectedPool.id}/add-liquidity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token0: selectedPool.token0,
          token1: selectedPool.token1,
          amount0: parseFloat(liquidityData.amount0),
          amount1: parseFloat(liquidityData.amount1)
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Added liquidity successfully. LP tokens: ${data.data.lpTokens}`);
        setLiquidityData({ amount0: '', amount1: '' });
        loadUserPositions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add liquidity');
      }
    } catch (error) {
      setError('Liquidity operation failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async (poolId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/pool/${poolId}/claim-rewards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Rewards claimed successfully!');
        loadRewards();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to claim rewards');
      }
    } catch (error) {
      setError('Failed to claim rewards');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Render Helpers ==========

  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <div className="pool-ui">
      {/* Header */}
      <div className="pool-header">
        <div className="header-content">
          <h1>Liquidity Pools</h1>
          <p>Provide liquidity and earn rewards</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span>Total Pools</span>
            <p>{pools.length}</p>
          </div>
          <div className="stat-card">
            <span>Your Positions</span>
            <p>{userPositions.length}</p>
          </div>
          <div className="stat-card">
            <span>Rewards Earned</span>
            <p>${formatNumber(rewards.totalRewards)}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="icon" />
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="pool-content">
        <Tabs defaultValue="explore" className="pool-tabs">
          <TabsList className="tabs-list">
            <TabsTrigger value="explore">Explore Pools</TabsTrigger>
            <TabsTrigger value="my-positions">My Positions ({userPositions.length})</TabsTrigger>
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          {/* Explore Pools Tab */}
          <TabsContent value="explore" className="tab-content">
            <div className="pools-grid">
              {loading ? (
                <div className="loading-state">
                  <Loader2 className="spinner" />
                  <p>Loading pools...</p>
                </div>
              ) : pools.length === 0 ? (
                <div className="empty-state">
                  <p>No pools available</p>
                </div>
              ) : (
                pools.map(pool => (
                  <Card key={pool.id} className="pool-card">
                    <CardHeader>
                      <div className="pool-card-header">
                        <CardTitle className="pool-name">
                          {pool.token0.slice(0, 6)}...{pool.token0.slice(-4)} / {pool.token1.slice(0, 6)}...{pool.token1.slice(-4)}
                        </CardTitle>
                        <Badge variant={pool.isActive ? 'default' : 'secondary'}>
                          {pool.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="pool-details">
                        <div className="detail-item">
                          <span>Fee Tier</span>
                          <p>{[0.01, 0.05, 0.1, 0.5][pool.feeTier]}%</p>
                        </div>
                        <div className="detail-item">
                          <span>Liquidity</span>
                          <p>${formatNumber(pool.totalLiquidity)}</p>
                        </div>
                        <div className="detail-item">
                          <span>Created</span>
                          <p>{new Date(pool.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        className="pool-action-btn"
                        onClick={() => {
                          setSelectedPool(pool);
                          document.querySelector('[value="swap"]').click?.();
                        }}
                        disabled={loading || !pool.isActive}
                      >
                        Trade
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* My Positions Tab */}
          <TabsContent value="my-positions" className="tab-content">
            <div className="positions-list">
              {userPositions.length === 0 ? (
                <div className="empty-state">
                  <p>No liquidity positions yet</p>
                </div>
              ) : (
                userPositions.map(position => (
                  <Card key={position.poolId} className="position-card">
                    <CardHeader>
                      <CardTitle>{position.tokens}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="position-details">
                        <div className="detail-row">
                          <span>LP Tokens</span>
                          <p>{formatNumber(position.lpTokens)}</p>
                        </div>
                        <div className="detail-row">
                          <span>Pool Share</span>
                          <p>{(position.share / 1e18 * 100).toFixed(4)}%</p>
                        </div>
                        <div className="detail-row">
                          <span>Rewards Earned</span>
                          <p className="highlight">${formatNumber(position.rewardsEarned)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Swap Tab */}
          <TabsContent value="swap" className="tab-content">
            <Card className="swap-card">
              <CardHeader>
                <CardTitle>Swap Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPool ? (
                  <div className="swap-form">
                    <div className="form-section">
                      <label>From</label>
                      <div className="input-group">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={swapData.amountIn}
                          onChange={(e) => {
                            setSwapData(prev => ({ ...prev, amountIn: e.target.value }));
                            getSwapQuote(selectedPool.id, selectedPool.token0, e.target.value);
                          }}
                        />
                        <div className="token-badge">{selectedPool.token0.slice(0, 6)}</div>
                      </div>
                    </div>

                    <div className="swap-arrow">↓</div>

                    <div className="form-section">
                      <label>To</label>
                      <div className="input-group">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={swapData.amountOut}
                          disabled
                        />
                        <div className="token-badge">{selectedPool.token1.slice(0, 6)}</div>
                      </div>
                    </div>

                    <div className="swap-details">
                      <div className="detail-row">
                        <span>Price Impact</span>
                        <p className={parseFloat(priceImpact) > 2 ? 'warning' : ''}>
                          {formatNumber(priceImpact)}%
                        </p>
                      </div>
                      <div className="detail-row">
                        <span>Slippage</span>
                        <Input
                          type="number"
                          value={slippage}
                          onChange={(e) => setSlippage(e.target.value)}
                          step="0.1"
                          min="0"
                          max="50"
                          className="slippage-input"
                        />
                      </div>
                    </div>

                    <Button
                      className="swap-button"
                      onClick={handleSwap}
                      disabled={loading || !swapData.amountIn || !swapData.amountOut}
                    >
                      {loading ? <Loader2 className="spinner" /> : 'Execute Swap'}
                    </Button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Select a pool from Explore tab to swap</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="tab-content">
            <Card className="rewards-card">
              <CardHeader>
                <CardTitle>Rewards & Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rewards-summary">
                  <div className="reward-stat">
                    <DollarSign className="icon" />
                    <div>
                      <span>Total Rewards</span>
                      <p>${formatNumber(rewards.totalRewards)}</p>
                    </div>
                  </div>
                  <div className="reward-stat">
                    <TrendingUp className="icon" />
                    <div>
                      <span>Claimable</span>
                      <p>{rewards.claimable.length} pools</p>
                    </div>
                  </div>
                </div>

                <div className="claimable-rewards">
                  {rewards.claimable.length === 0 ? (
                    <p className="empty">No rewards to claim</p>
                  ) : (
                    rewards.claimable.map(reward => (
                      <div key={reward.poolId} className="reward-item">
                        <div className="reward-info">
                          <span>{reward.tokens}</span>
                          <p>${formatNumber(reward.earned)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleClaimRewards(reward.poolId)}
                          disabled={loading || parseFloat(reward.earned) === 0}
                        >
                          {loading ? 'Claiming...' : 'Claim'}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PoolUI;
