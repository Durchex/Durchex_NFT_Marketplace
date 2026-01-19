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
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import './FinancingUI.css';

/**
 * FinancingUI - NFT-Backed Financing Interface
 * Features:
 * - Loan creation with NFT collateral
 * - Payment tracking and management
 * - Risk assessment visualization
 * - Portfolio monitoring
 * - Liquidation alerts
 */
const FinancingUI = ({ userAddress, userNFTs = [] }) => {
  // ========== State ==========
  const [loans, setLoans] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [rates, setRates] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [loanForm, setLoanForm] = useState({
    nftContract: '',
    nftTokenId: '',
    loanAmount: '',
    loanDuration: 12
  });
  const [paymentForm, setPaymentForm] = useState({
    loanId: '',
    paymentAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('loans');

  // ========== Effects ==========

  useEffect(() => {
    if (userAddress) {
      loadLoans();
      loadPortfolio();
      loadRates();
    }
  }, [userAddress]);

  // ========== API Calls ==========

  const loadLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/financing/user/loans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLoans(data.data);
      }
    } catch (error) {
      console.error('Failed to load loans:', error);
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolio = async () => {
    try {
      const response = await fetch('/api/v1/financing/user/portfolio', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPortfolio(data.data);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  const loadRates = async () => {
    try {
      const response = await fetch('/api/v1/financing/rates');
      const data = await response.json();
      if (data.success) {
        setRates(data.data);
      }
    } catch (error) {
      console.error('Failed to load rates:', error);
    }
  };

  // ========== Handlers ==========

  const handleCreateLoan = async () => {
    if (!loanForm.nftContract || !loanForm.loanAmount || !loanForm.loanDuration) {
      setError('Please fill in all loan details');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/financing/loan/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nftContract: loanForm.nftContract,
          nftTokenId: loanForm.nftTokenId,
          loanAmount: parseFloat(loanForm.loanAmount),
          loanDuration: parseInt(loanForm.loanDuration)
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Loan created! ID: ${data.data.id}`);
        setLoanForm({ nftContract: '', nftTokenId: '', loanAmount: '', loanDuration: 12 });
        loadLoans();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create loan');
      }
    } catch (error) {
      setError('Loan creation failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async (loanId) => {
    const amount = paymentForm.paymentAmount;
    if (!amount || amount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/financing/loan/${loanId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ paymentAmount: parseFloat(amount) })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Payment processed successfully!');
        setPaymentForm({ loanId: '', paymentAmount: '' });
        loadLoans();
        loadPortfolio();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (error) {
      setError('Payment processing failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepayLoan = async (loanId) => {
    if (!window.confirm('Repay entire loan? This will close your collateral position.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/financing/loan/${loanId}/repay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Loan repaid successfully!');
        loadLoans();
        loadPortfolio();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Repayment failed');
      }
    } catch (error) {
      setError('Repayment processing failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Render Helpers ==========

  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_LIQUIDATION':
        return 'warning';
      case 'LIQUIDATED':
      case 'DEFAULTED':
        return 'danger';
      case 'REPAID':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="icon success" />;
      case 'PENDING_LIQUIDATION':
        return <AlertTriangle className="icon warning" />;
      case 'REPAID':
        return <CheckCircle className="icon secondary" />;
      default:
        return <AlertCircle className="icon" />;
    }
  };

  return (
    <div className="financing-ui">
      {/* Header */}
      <div className="financing-header">
        <div className="header-content">
          <h1>NFT Financing</h1>
          <p>Borrow against your NFT assets</p>
        </div>
        <div className="header-stats">
          {portfolio && (
            <>
              <div className="stat-card">
                <span>Total Loaned</span>
                <p>${formatNumber(portfolio.totalLoaned)}</p>
              </div>
              <div className="stat-card">
                <span>Active Loans</span>
                <p>{portfolio.activeLoanCount}</p>
              </div>
              <div className="stat-card">
                <span>Portfolio Health</span>
                <p className={`health-${portfolio.portfolioHealth.toLowerCase()}`}>
                  {portfolio.portfolioHealth}
                </p>
              </div>
            </>
          )}
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
      <div className="financing-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="financing-tabs">
          <TabsList className="tabs-list">
            <TabsTrigger value="loans">My Loans ({loans.length})</TabsTrigger>
            <TabsTrigger value="new-loan">New Loan</TabsTrigger>
            <TabsTrigger value="rates">Interest Rates</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          {/* My Loans Tab */}
          <TabsContent value="loans" className="tab-content">
            <div className="loans-grid">
              {loading ? (
                <div className="loading-state">
                  <Loader2 className="spinner" />
                  <p>Loading loans...</p>
                </div>
              ) : loans.length === 0 ? (
                <div className="empty-state">
                  <p>No active loans. Create one to get started!</p>
                </div>
              ) : (
                loans.map(loan => (
                  <Card key={loan.id} className="loan-card">
                    <CardHeader>
                      <div className="loan-card-header">
                        <CardTitle>Loan #{loan.id}</CardTitle>
                        <Badge variant={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="loan-details">
                        <div className="detail-group">
                          <div className="detail-row">
                            <span>Loan Amount</span>
                            <p>${formatNumber(loan.loanAmount)}</p>
                          </div>
                          <div className="detail-row">
                            <span>Current Debt</span>
                            <p>${formatNumber(loan.currentDebt)}</p>
                          </div>
                          <div className="detail-row">
                            <span>Interest Rate</span>
                            <p>{loan.apr}%</p>
                          </div>
                        </div>

                        <div className="detail-group">
                          <div className="detail-row">
                            <span>Days Remaining</span>
                            <p>{loan.daysRemaining}</p>
                          </div>
                          <div className="detail-row">
                            <span>Monthly Payment</span>
                            <p>${formatNumber(loan.monthlyPayment)}</p>
                          </div>
                          <div className="detail-row">
                            <span>LTV</span>
                            <p className={loan.ltv > 70 ? 'warning' : ''}>{loan.ltv}%</p>
                          </div>
                        </div>

                        {loan.isLiquidationEligible && (
                          <div className="liquidation-warning">
                            <AlertTriangle className="icon" />
                            <span>⚠️ At risk of liquidation</span>
                          </div>
                        )}
                      </div>

                      <div className="loan-actions">
                        <div className="payment-form">
                          <Input
                            type="number"
                            placeholder="Payment amount"
                            value={paymentForm.loanId === loan.id ? paymentForm.paymentAmount : ''}
                            onChange={(e) => {
                              setPaymentForm({ loanId: loan.id, paymentAmount: e.target.value });
                            }}
                            disabled={loading || loan.status !== 'ACTIVE'}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleMakePayment(loan.id)}
                            disabled={loading || loan.status !== 'ACTIVE'}
                          >
                            Pay
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRepayLoan(loan.id)}
                          disabled={loading || loan.status !== 'ACTIVE'}
                        >
                          Repay All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* New Loan Tab */}
          <TabsContent value="new-loan" className="tab-content">
            <Card className="new-loan-card">
              <CardHeader>
                <CardTitle>Create New Loan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="loan-form">
                  <div className="form-group">
                    <label>NFT Contract Address</label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={loanForm.nftContract}
                      onChange={(e) => setLoanForm({ ...loanForm, nftContract: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Token ID</label>
                    <Input
                      type="number"
                      placeholder="12345"
                      value={loanForm.nftTokenId}
                      onChange={(e) => setLoanForm({ ...loanForm, nftTokenId: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Loan Amount (USDC)</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={loanForm.loanAmount}
                      onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Loan Duration (months)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={loanForm.loanDuration}
                      onChange={(e) => setLoanForm({ ...loanForm, loanDuration: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    className="create-btn"
                    onClick={handleCreateLoan}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="spinner" /> : 'Create Loan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interest Rates Tab */}
          <TabsContent value="rates" className="tab-content">
            <Card className="rates-card">
              <CardHeader>
                <CardTitle>Current Interest Rates</CardTitle>
              </CardHeader>
              <CardContent>
                {rates ? (
                  <div className="rates-table">
                    <div className="rates-header">
                      <span>Risk Tier</span>
                      <span>APR</span>
                      <span>Description</span>
                    </div>
                    {rates.riskTiers.map((tier, idx) => (
                      <div key={idx} className="rates-row">
                        <span className={`tier-badge tier-${tier.tier.toLowerCase()}`}>
                          {tier.tier}
                        </span>
                        <span className="rate">{tier.rate}%</span>
                        <span className="description">{tier.description}</span>
                      </div>
                    ))}
                    <div className="rates-footer">
                      <p>Platform Fee: {rates.platformFee}%</p>
                      <p>Insurance Fee: {rates.insuranceFee}%</p>
                    </div>
                  </div>
                ) : (
                  <p>Loading rates...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="tab-content">
            {portfolio ? (
              <div className="portfolio-grid">
                <Card className="portfolio-stat">
                  <CardHeader>
                    <CardTitle>Total Loaned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="big-number">${formatNumber(portfolio.totalLoaned)}</p>
                  </CardContent>
                </Card>

                <Card className="portfolio-stat">
                  <CardHeader>
                    <CardTitle>Total Debt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="big-number">${formatNumber(portfolio.totalDebt)}</p>
                  </CardContent>
                </Card>

                <Card className="portfolio-stat">
                  <CardHeader>
                    <CardTitle>Average APR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="big-number">{portfolio.averageAPR}%</p>
                  </CardContent>
                </Card>

                <Card className="portfolio-stat">
                  <CardHeader>
                    <CardTitle>Portfolio Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`big-number health-${portfolio.portfolioHealth.toLowerCase()}`}>
                      {portfolio.portfolioHealth}
                    </p>
                  </CardContent>
                </Card>

                <Card className="portfolio-stat">
                  <CardHeader>
                    <CardTitle>Active Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="big-number">{portfolio.activeLoanCount}</p>
                  </CardContent>
                </Card>

                <Card className="portfolio-stat warning">
                  <CardHeader>
                    <CardTitle>At Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="big-number danger">{portfolio.liquidationRiskCount}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <p>Loading portfolio...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancingUI;
