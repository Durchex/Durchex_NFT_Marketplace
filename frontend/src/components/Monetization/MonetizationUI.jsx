import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Gift,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Zap,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Copy,
  Check
} from 'lucide-react';
import './MonetizationUI.css';

/**
 * MonetizationUI - Creator Monetization Tools
 * Features:
 * - Send tips/donations to creators
 * - Subscribe to creator tiers
 * - Purchase merchandise
 * - View earnings and analytics
 * - Request payouts
 */
const MonetizationUI = ({ userAddress, isCreator = false }) => {
  // ========== State ==========
  const [activeTab, setActiveTab] = useState('tips');
  const [tiers, setTiers] = useState([]);
  const [merchandise, setMerchandise] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Tip form
  const [tipForm, setTipForm] = useState({
    creatorAddress: '',
    amount: '',
    message: ''
  });

  // Merchandise form
  const [merchForm, setMerchForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    inventory: 100
  });

  // Subscription tier form
  const [tierForm, setTierForm] = useState({
    tierName: '',
    monthlyPrice: '',
    benefits: '',
    maxSubscribers: ''
  });

  // Payout form
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payoutAddress: ''
  });

  // ========== Effects ==========

  useEffect(() => {
    if (isCreator) {
      loadCreatorData();
    }
  }, [isCreator, userAddress]);

  // ========== API Calls ==========

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      
      // Load earnings
      const earningsRes = await fetch('/api/v1/monetization/earnings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const earningsData = await earningsRes.json();
      if (earningsData.success) setEarnings(earningsData.data);

      // Load stats
      const statsRes = await fetch('/api/v1/monetization/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Load tiers
      const tiersRes = await fetch(`/api/v1/monetization/subscriptions/creator/${userAddress}`);
      const tiersData = await tiersRes.json();
      if (tiersData.success) setTiers(tiersData.data);

      // Load merchandise
      const merchRes = await fetch(`/api/v1/monetization/merchandise/creator/${userAddress}`);
      const merchData = await merchRes.json();
      if (merchData.success) setMerchandise(merchData.data);
    } catch (error) {
      console.error('Failed to load creator data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTip = async () => {
    if (!tipForm.creatorAddress || !tipForm.amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/monetization/tips/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          creatorAddress: tipForm.creatorAddress,
          amount: parseFloat(tipForm.amount),
          message: tipForm.message
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Tipped ${tipForm.amount} to creator!`);
        setTipForm({ creatorAddress: '', amount: '', message: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to send tip');
      }
    } catch (error) {
      setError('Tip failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTier = async () => {
    if (!tierForm.tierName || !tierForm.monthlyPrice) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/monetization/subscriptions/tiers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tierName: tierForm.tierName,
          monthlyPrice: parseFloat(tierForm.monthlyPrice),
          benefits: tierForm.benefits.split(',').map(b => b.trim()),
          maxSubscribers: tierForm.maxSubscribers ? parseInt(tierForm.maxSubscribers) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Subscription tier created!');
        setTierForm({ tierName: '', monthlyPrice: '', benefits: '', maxSubscribers: '' });
        setTiers([...tiers, data.data]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create tier');
      }
    } catch (error) {
      setError('Tier creation failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMerchandise = async () => {
    if (!merchForm.name || !merchForm.price) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/monetization/merchandise/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: merchForm.name,
          description: merchForm.description,
          price: parseFloat(merchForm.price),
          imageUrl: merchForm.imageUrl,
          inventory: parseInt(merchForm.inventory)
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Merchandise created!');
        setMerchForm({ name: '', description: '', price: '', imageUrl: '', inventory: 100 });
        setMerchandise([...merchandise, data.data]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create merchandise');
      }
    } catch (error) {
      setError('Merchandise creation failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutForm.amount || !payoutForm.payoutAddress) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/monetization/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(payoutForm.amount),
          payoutAddress: payoutForm.payoutAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Payout request submitted!');
        setPayoutForm({ amount: '', payoutAddress: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to request payout');
      }
    } catch (error) {
      setError('Payout request failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ========== Render Helpers ==========

  const formatCurrency = (amount) => {
    return (Math.round(amount * 100) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ========== Render ==========

  return (
    <div className="monetization-ui">
      {/* Header */}
      <div className="monetization-header">
        <div className="header-content">
          <h1>Creator Monetization</h1>
          <p>Tips, subscriptions, merchandise & more</p>
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
      <div className="monetization-content">
        <Tabs defaultValue="tips" className="monetization-tabs">
          <TabsList className="tabs-list">
            <TabsTrigger value="tips">💖 Tips</TabsTrigger>
            <TabsTrigger value="subscriptions">🎁 Subscriptions</TabsTrigger>
            <TabsTrigger value="merchandise">🛍️ Merchandise</TabsTrigger>
            {isCreator && <TabsTrigger value="earnings">💰 Earnings</TabsTrigger>}
          </TabsList>

          {/* Tips Tab */}
          <TabsContent value="tips" className="tab-content">
            <Card className="tips-card">
              <CardHeader>
                <CardTitle>Send a Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="form-group">
                  <label>Creator Wallet Address</label>
                  <Input
                    placeholder="0x..."
                    value={tipForm.creatorAddress}
                    onChange={(e) => setTipForm({ ...tipForm, creatorAddress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Amount (ETH)</label>
                  <Input
                    type="number"
                    placeholder="0.1"
                    step="0.01"
                    value={tipForm.amount}
                    onChange={(e) => setTipForm({ ...tipForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Message (Optional)</label>
                  <Input
                    placeholder="Thank you for..."
                    maxLength={200}
                    value={tipForm.message}
                    onChange={(e) => setTipForm({ ...tipForm, message: e.target.value })}
                  />
                </div>

                <Button
                  className="send-button"
                  onClick={handleSendTip}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spinner" /> : <Heart />}
                  Send Tip
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="tab-content">
            {isCreator ? (
              <>
                {/* Create Tier */}
                <Card className="create-tier-card">
                  <CardHeader>
                    <CardTitle>Create Subscription Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="form-group">
                      <label>Tier Name</label>
                      <Input
                        placeholder="e.g., Silver Member"
                        value={tierForm.tierName}
                        onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Monthly Price (ETH)</label>
                      <Input
                        type="number"
                        placeholder="0.5"
                        step="0.01"
                        value={tierForm.monthlyPrice}
                        onChange={(e) => setTierForm({ ...tierForm, monthlyPrice: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Benefits (comma-separated)</label>
                      <Input
                        placeholder="Exclusive content, early access, ..."
                        value={tierForm.benefits}
                        onChange={(e) => setTierForm({ ...tierForm, benefits: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Subscribers (optional)</label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={tierForm.maxSubscribers}
                        onChange={(e) => setTierForm({ ...tierForm, maxSubscribers: e.target.value })}
                      />
                    </div>

                    <Button
                      className="create-button"
                      onClick={handleCreateTier}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="spinner" /> : <Zap />}
                      Create Tier
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Tiers */}
                <div className="tiers-grid">
                  {tiers.map(tier => (
                    <Card key={tier.id} className="tier-card">
                      <CardHeader>
                        <CardTitle>{tier.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="tier-info">
                          <div className="price">${formatCurrency(tier.monthlyPrice)}/mo</div>
                          <div className="stat">
                            <Users className="icon" />
                            <span>{tier.currentSubscribers} subscribers</span>
                          </div>
                          <div className="benefits">
                            {tier.benefits.map((benefit, idx) => (
                              <Badge key={idx} variant="secondary">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>View available subscriptions from creators you follow</p>
              </div>
            )}
          </TabsContent>

          {/* Merchandise Tab */}
          <TabsContent value="merchandise" className="tab-content">
            {isCreator ? (
              <>
                {/* Create Merchandise */}
                <Card className="create-merch-card">
                  <CardHeader>
                    <CardTitle>Create Merchandise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="form-group">
                      <label>Product Name</label>
                      <Input
                        placeholder="e.g., Official T-Shirt"
                        value={merchForm.name}
                        onChange={(e) => setMerchForm({ ...merchForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <Input
                        placeholder="Product details..."
                        value={merchForm.description}
                        onChange={(e) => setMerchForm({ ...merchForm, description: e.target.value })}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Price (USD)</label>
                        <Input
                          type="number"
                          placeholder="29.99"
                          step="0.01"
                          value={merchForm.price}
                          onChange={(e) => setMerchForm({ ...merchForm, price: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Inventory</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={merchForm.inventory}
                          onChange={(e) => setMerchForm({ ...merchForm, inventory: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Image URL</label>
                      <Input
                        placeholder="https://..."
                        value={merchForm.imageUrl}
                        onChange={(e) => setMerchForm({ ...merchForm, imageUrl: e.target.value })}
                      />
                    </div>

                    <Button
                      className="create-button"
                      onClick={handleCreateMerchandise}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="spinner" /> : <ShoppingBag />}
                      Create Product
                    </Button>
                  </CardContent>
                </Card>

                {/* Merchandise Grid */}
                <div className="merchandise-grid">
                  {merchandise.map(item => (
                    <Card key={item.id} className="merch-card">
                      {item.imageUrl && (
                        <div className="merch-image">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                      )}
                      <CardContent>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="merch-stats">
                          <div className="stat">
                            <span>Price:</span>
                            <strong>${formatCurrency(item.price)}</strong>
                          </div>
                          <div className="stat">
                            <span>Sold:</span>
                            <strong>{item.sold}/{item.inventory}</strong>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Browse merchandise from your favorite creators</p>
              </div>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          {isCreator && (
            <TabsContent value="earnings" className="tab-content">
              {loading ? (
                <div className="loading">
                  <Loader2 className="spinner" />
                </div>
              ) : stats ? (
                <>
                  {/* Earnings Summary */}
                  <div className="earnings-summary">
                    <Card className="summary-card">
                      <DollarSign className="icon" />
                      <div>
                        <span>Total Earnings</span>
                        <p className="amount">${formatCurrency(stats.totalEarnings)}</p>
                      </div>
                    </Card>

                    <Card className="summary-card">
                      <Heart className="icon" />
                      <div>
                        <span>Tips Received</span>
                        <p className="amount">{stats.tips}</p>
                      </div>
                    </Card>

                    <Card className="summary-card">
                      <Users className="icon" />
                      <div>
                        <span>Total Subscribers</span>
                        <p className="amount">{stats.totalSubscribers}</p>
                      </div>
                    </Card>

                    <Card className="summary-card">
                      <Package className="icon" />
                      <div>
                        <span>Merchandise Sold</span>
                        <p className="amount">{stats.totalMerchandiseSold}</p>
                      </div>
                    </Card>
                  </div>

                  {/* Earnings Breakdown */}
                  <Card className="breakdown-card">
                    <CardHeader>
                      <CardTitle>Earnings Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="breakdown">
                        <div className="breakdown-item">
                          <span>Tips</span>
                          <p>${formatCurrency(stats.earningsByType.tips)}</p>
                        </div>
                        <div className="breakdown-item">
                          <span>Subscriptions</span>
                          <p>${formatCurrency(stats.earningsByType.subscriptions)}</p>
                        </div>
                        <div className="breakdown-item">
                          <span>Merchandise</span>
                          <p>${formatCurrency(stats.earningsByType.merchandise)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payout Section */}
                  <Card className="payout-card">
                    <CardHeader>
                      <CardTitle>Request Payout</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="form-group">
                        <label>Amount to Withdraw</label>
                        <Input
                          type="number"
                          placeholder={formatCurrency(stats.totalEarnings)}
                          value={payoutForm.amount}
                          onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Payout Address</label>
                        <div className="address-input">
                          <Input
                            placeholder="0x..."
                            value={payoutForm.payoutAddress}
                            onChange={(e) => setPayoutForm({ ...payoutForm, payoutAddress: e.target.value })}
                          />
                          {payoutForm.payoutAddress && (
                            <button
                              className="copy-btn"
                              onClick={() => copyToClipboard(payoutForm.payoutAddress)}
                            >
                              {copied ? <Check /> : <Copy />}
                            </button>
                          )}
                        </div>
                      </div>

                      <Button
                        className="payout-button"
                        onClick={handleRequestPayout}
                        disabled={loading || !payoutForm.amount || !payoutForm.payoutAddress}
                      >
                        {loading ? <Loader2 className="spinner" /> : <ArrowUpRight />}
                        Request Payout
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="empty-state">
                  <p>No earnings data available</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default MonetizationUI;
