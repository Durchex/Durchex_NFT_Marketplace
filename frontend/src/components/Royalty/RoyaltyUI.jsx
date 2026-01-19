import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './RoyaltyUI.css';

/**
 * RoyaltyUI Component
 * Multi-creator royalty management dashboard with ERC-2981 support
 */
const RoyaltyUI = ({ userAddress, signer }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [royalties, setRoyalties] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [collectionAddress, setCollectionAddress] = useState('');
  const [recipients, setRecipients] = useState([{ recipient: '', percentage: 0 }]);
  const [selectedNFT, setSelectedNFT] = useState('');
  const [nftRecipients, setNftRecipients] = useState([{ recipient: '', percentage: 0 }]);

  // Fetch royalty stats on mount
  useEffect(() => {
    if (userAddress) {
      fetchRoyaltyStats();
    }
  }, [userAddress]);

  /**
   * Fetch royalty statistics
   */
  const fetchRoyaltyStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/royalty/stats/${userAddress}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setPendingPayments(data.data.pendingByCollection || []);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch royalty statistics');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set collection-level royalties
   */
  const handleSetCollectionRoyalty = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Validate inputs
      if (!collectionAddress || recipients.some(r => !r.recipient || r.percentage <= 0)) {
        setError('Please fill in all fields');
        return;
      }

      const response = await fetch('/api/v1/royalty/set-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: collectionAddress,
          recipients: recipients.filter(r => r.recipient && r.percentage > 0),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Collection royalty set successfully!');
        setCollectionAddress('');
        setRecipients([{ recipient: '', percentage: 0 }]);
        await fetchRoyaltyStats();
      } else {
        setError(data.message || 'Failed to set royalty');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set NFT-level royalties
   */
  const handleSetNFTRoyalty = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      if (!collectionAddress || !selectedNFT || nftRecipients.some(r => !r.recipient || r.percentage <= 0)) {
        setError('Please fill in all fields');
        return;
      }

      const response = await fetch('/api/v1/royalty/set-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: collectionAddress,
          tokenId: selectedNFT,
          recipients: nftRecipients.filter(r => r.recipient && r.percentage > 0),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('NFT royalty set successfully!');
        setSelectedNFT('');
        setNftRecipients([{ recipient: '', percentage: 0 }]);
        await fetchRoyaltyStats();
      } else {
        setError(data.message || 'Failed to set NFT royalty');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Claim pending royalties
   */
  const handleClaimRoyalties = async (collection) => {
    try {
      setError('');
      setLoading(true);

      const response = await fetch('/api/v1/royalty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Claimed ${data.data.amountFormatted} from ${collection.slice(0, 6)}...`);
        await fetchRoyaltyStats();
      } else {
        setError(data.message || 'Failed to claim royalties');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add recipient input field
   */
  const addRecipient = (setFunc) => {
    setFunc(prev => [...prev, { recipient: '', percentage: 0 }]);
  };

  /**
   * Remove recipient input field
   */
  const removeRecipient = (index, setFunc) => {
    setFunc(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Update recipient field
   */
  const updateRecipient = (index, field, value, setFunc) => {
    setFunc(prev => {
      const updated = [...prev];
      updated[index][field] = field === 'percentage' ? parseInt(value) || 0 : value;
      return updated;
    });
  };

  return (
    <div className="royalty-container">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="royalty-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collection">Collection Royalty</TabsTrigger>
          <TabsTrigger value="nft">NFT Royalty</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="royalty-content">
          {error && <Alert className="alert-error"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="alert-success"><AlertDescription>{success}</AlertDescription></Alert>}

          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : stats ? (
            <div className="royalty-overview">
              <div className="overview-grid">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Distributed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="stat-value">{stats.totalDistributed?.toFixed(2)} ETH</div>
                    <div className="stat-label">Across all collections</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="stat-value">{stats.totalPending?.toFixed(2)} ETH</div>
                    <div className="stat-label">{pendingPayments.length} collections</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="stat-value">{stats.collectionCount || 0}</div>
                    <div className="stat-label">With royalty setup</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recipients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="stat-value">{stats.recipientCount || 0}</div>
                    <div className="stat-label">Receiving royalties</div>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Chart */}
              {stats.distributionHistory && stats.distributionHistory.length > 0 && (
                <Card className="chart-card">
                  <CardHeader>
                    <CardTitle>Distribution Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.distributionHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>

        {/* Collection Royalty Tab */}
        <TabsContent value="collection" className="royalty-content">
          <Card>
            <CardHeader>
              <CardTitle>Set Collection-Level Royalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-section">
                <div className="form-group">
                  <label>Collection Address</label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="recipients-section">
                  <label>Royalty Recipients</label>
                  {recipients.map((recipient, index) => (
                    <div key={index} className="recipient-input">
                      <Input
                        type="text"
                        placeholder="Recipient address (0x...)"
                        value={recipient.recipient}
                        onChange={(e) => updateRecipient(index, 'recipient', e.target.value, setRecipients)}
                        disabled={loading}
                      />
                      <Input
                        type="number"
                        placeholder="Percentage (0.1 - 50%)"
                        min="0.1"
                        max="50"
                        step="0.1"
                        value={recipient.percentage}
                        onChange={(e) => updateRecipient(index, 'percentage', e.target.value, setRecipients)}
                        disabled={loading}
                      />
                      {recipients.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRecipient(index, setRecipients)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() => addRecipient(setRecipients)}
                    disabled={loading || recipients.length >= 10}
                    className="mt-2"
                  >
                    + Add Recipient
                  </Button>
                </div>

                {error && <Alert className="alert-error"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="alert-success"><AlertDescription>{success}</AlertDescription></Alert>}

                <Button
                  onClick={handleSetCollectionRoyalty}
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? 'Setting...' : 'Set Collection Royalty'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Royalty Tab */}
        <TabsContent value="nft" className="royalty-content">
          <Card>
            <CardHeader>
              <CardTitle>Set NFT-Level Royalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-section">
                <div className="form-group">
                  <label>Collection Address</label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Token ID</label>
                  <Input
                    type="text"
                    placeholder="Token ID"
                    value={selectedNFT}
                    onChange={(e) => setSelectedNFT(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="recipients-section">
                  <label>Royalty Recipients</label>
                  {nftRecipients.map((recipient, index) => (
                    <div key={index} className="recipient-input">
                      <Input
                        type="text"
                        placeholder="Recipient address (0x...)"
                        value={recipient.recipient}
                        onChange={(e) => updateRecipient(index, 'recipient', e.target.value, setNftRecipients)}
                        disabled={loading}
                      />
                      <Input
                        type="number"
                        placeholder="Percentage (0.1 - 50%)"
                        min="0.1"
                        max="50"
                        step="0.1"
                        value={recipient.percentage}
                        onChange={(e) => updateRecipient(index, 'percentage', e.target.value, setNftRecipients)}
                        disabled={loading}
                      />
                      {nftRecipients.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRecipient(index, setNftRecipients)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() => addRecipient(setNftRecipients)}
                    disabled={loading || nftRecipients.length >= 10}
                    className="mt-2"
                  >
                    + Add Recipient
                  </Button>
                </div>

                {error && <Alert className="alert-error"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="alert-success"><AlertDescription>{success}</AlertDescription></Alert>}

                <Button
                  onClick={handleSetNFTRoyalty}
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? 'Setting...' : 'Set NFT Royalty'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Payments Tab */}
        <TabsContent value="pending" className="royalty-content">
          <Card>
            <CardHeader>
              <CardTitle>Pending Royalty Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="empty-state">No pending royalty payments</div>
              ) : (
                <div className="pending-table">
                  {pendingPayments.map((payment, idx) => (
                    <div key={idx} className="pending-row">
                      <div className="pending-info">
                        <div className="collection-addr">{payment.collection.slice(0, 10)}...</div>
                        <div className="payment-amount">{payment.amount} ETH</div>
                      </div>
                      <Button
                        onClick={() => handleClaimRoyalties(payment.collection)}
                        disabled={loading}
                        className="claim-btn"
                      >
                        {loading ? 'Processing...' : 'Claim'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoyaltyUI;
