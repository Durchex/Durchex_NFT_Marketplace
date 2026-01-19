import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DAODashboard.css';

const DAODashboard = () => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userVotes, setUserVotes] = useState(0);
  const [treasuryStats, setTreasuryStats] = useState({
    balance: 0,
    allocated: 0,
    spent: 0,
    available: 0,
  });
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    proposalType: 'PARAMETER_CHANGE',
    targetBudget: '',
  });

  // Fetch proposals
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/governance/proposals');
      setProposals(response.data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user voting power
  const fetchUserVotes = async () => {
    try {
      const response = await axios.get('/api/governance/my-votes');
      setUserVotes(response.data.votes || 0);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  // Fetch treasury stats
  const fetchTreasuryStats = async () => {
    try {
      const response = await axios.get('/api/governance/treasury-stats');
      setTreasuryStats(response.data);
    } catch (error) {
      console.error('Error fetching treasury stats:', error);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchUserVotes();
    fetchTreasuryStats();
  }, []);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/governance/create-proposal', proposalForm);
      setShowCreateProposal(false);
      setProposalForm({
        title: '',
        description: '',
        proposalType: 'PARAMETER_CHANGE',
        targetBudget: '',
      });
      fetchProposals();
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const handleVote = async (proposalId, support) => {
    try {
      await axios.post(`/api/governance/vote`, {
        proposalId,
        support,
      });
      fetchProposals();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className="dao-dashboard">
      {/* Header */}
      <div className="dao-header">
        <h1>Durchex DAO</h1>
        <p>Decentralized governance for the Durchex marketplace</p>
        <div className="voting-power">
          <span className="label">Your Voting Power:</span>
          <span className="value">{(userVotes / 1e18).toFixed(2)} DXO</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="dao-tabs">
        <button
          className={`tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          Proposals
        </button>
        <button
          className={`tab-btn ${activeTab === 'treasury' ? 'active' : ''}`}
          onClick={() => setActiveTab('treasury')}
        >
          Treasury
        </button>
        <button
          className={`tab-btn ${activeTab === 'governance' ? 'active' : ''}`}
          onClick={() => setActiveTab('governance')}
        >
          Governance
        </button>
      </div>

      {/* Content */}
      <div className="dao-content">
        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div className="proposals-section">
            <div className="section-header">
              <h2>Active Proposals</h2>
              <button
                className="create-btn"
                onClick={() => setShowCreateProposal(true)}
                disabled={userVotes === 0}
              >
                + New Proposal
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading proposals...</div>
            ) : proposals.length > 0 ? (
              <div className="proposals-list">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="proposal-card">
                    <div className="proposal-header">
                      <h3>{proposal.title}</h3>
                      <span className={`status status-${proposal.state}`}>
                        {proposal.state}
                      </span>
                    </div>

                    <p className="proposal-description">{proposal.description}</p>

                    <div className="proposal-type">
                      <span className="type-badge">{proposal.type}</span>
                    </div>

                    {/* Voting Stats */}
                    <div className="voting-stats">
                      <div className="stat">
                        <span className="label">For</span>
                        <div className="vote-bar">
                          <div
                            className="vote-fill for"
                            style={{
                              width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="value">{proposal.forVotes} votes</span>
                      </div>

                      <div className="stat">
                        <span className="label">Against</span>
                        <div className="vote-bar">
                          <div
                            className="vote-fill against"
                            style={{
                              width: `${(proposal.againstVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="value">{proposal.againstVotes} votes</span>
                      </div>

                      <div className="stat">
                        <span className="label">Abstain</span>
                        <span className="value">{proposal.abstainVotes} votes</span>
                      </div>
                    </div>

                    {/* Voting Period */}
                    <div className="voting-period">
                      <span>
                        Ends in{' '}
                        {Math.max(
                          0,
                          Math.ceil((proposal.endBlock - proposal.currentBlock) / 12 / 3600 / 24)
                        )}{' '}
                        days
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {proposal.state === 'Active' && !proposal.hasVoted && (
                      <div className="vote-buttons">
                        <button
                          className="vote-btn for"
                          onClick={() => handleVote(proposal.id, 1)}
                        >
                          Vote For
                        </button>
                        <button
                          className="vote-btn against"
                          onClick={() => handleVote(proposal.id, 0)}
                        >
                          Vote Against
                        </button>
                        <button
                          className="vote-btn abstain"
                          onClick={() => handleVote(proposal.id, 2)}
                        >
                          Abstain
                        </button>
                      </div>
                    )}

                    {proposal.hasVoted && (
                      <div className="voted-badge">✓ You voted</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-proposals">
                <p>No active proposals</p>
              </div>
            )}
          </div>
        )}

        {/* Treasury Tab */}
        {activeTab === 'treasury' && (
          <div className="treasury-section">
            <h2>Treasury Management</h2>

            {/* Treasury Stats Cards */}
            <div className="treasury-stats">
              <div className="stat-card">
                <h4>Total Balance</h4>
                <p className="stat-value">{treasuryStats.balance.toFixed(2)} ETH</p>
              </div>

              <div className="stat-card">
                <h4>Allocated</h4>
                <p className="stat-value">{treasuryStats.allocated.toFixed(2)} ETH</p>
              </div>

              <div className="stat-card">
                <h4>Spent</h4>
                <p className="stat-value">{treasuryStats.spent.toFixed(2)} ETH</p>
              </div>

              <div className="stat-card">
                <h4>Available</h4>
                <p className="stat-value">{treasuryStats.available.toFixed(2)} ETH</p>
              </div>
            </div>

            {/* Treasury Chart */}
            <div className="treasury-chart">
              <h3>Treasury Allocation</h3>
              <div className="chart-bars">
                <div className="bar-group">
                  <div className="bar-label">Spent vs Available</div>
                  <div className="bars">
                    <div
                      className="bar spent"
                      style={{
                        flex: treasuryStats.spent || 0.1,
                      }}
                      title={`Spent: ${treasuryStats.spent.toFixed(2)} ETH`}
                    ></div>
                    <div
                      className="bar available"
                      style={{
                        flex: treasuryStats.available || 0.1,
                      }}
                      title={`Available: ${treasuryStats.available.toFixed(2)} ETH`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Allocations */}
            <div className="recent-allocations">
              <h3>Recent Allocations</h3>
              <div className="allocations-list">
                <p className="placeholder">View treasury allocations in proposal details</p>
              </div>
            </div>
          </div>
        )}

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <div className="governance-section">
            <h2>Governance Information</h2>

            <div className="governance-info">
              <div className="info-card">
                <h3>Proposal Requirements</h3>
                <ul>
                  <li>Minimum voting power: 10,000 DXO</li>
                  <li>Voting period: 7 days</li>
                  <li>Quorum required: 4%</li>
                  <li>Execution delay: 1 day</li>
                </ul>
              </div>

              <div className="info-card">
                <h3>Proposal Types</h3>
                <ul>
                  <li>
                    <strong>Parameter Change:</strong> Modify platform parameters
                  </li>
                  <li>
                    <strong>Treasury Allocation:</strong> Fund initiatives
                  </li>
                  <li>
                    <strong>Feature Update:</strong> Add/modify features
                  </li>
                  <li>
                    <strong>Emergency Action:</strong> Emergency response measures
                  </li>
                </ul>
              </div>

              <div className="info-card">
                <h3>Voting Power</h3>
                <ul>
                  <li>Hold DXO tokens to gain voting power</li>
                  <li>1 DXO = 1 vote</li>
                  <li>Vote weight is determined by token delegation</li>
                  <li>Self-delegate tokens to vote</li>
                </ul>
              </div>

              <div className="info-card">
                <h3>Resources</h3>
                <ul>
                  <li>
                    <a href="#docs" target="_blank" rel="noopener noreferrer">
                      Governance Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#forum" target="_blank" rel="noopener noreferrer">
                      Discussion Forum
                    </a>
                  </li>
                  <li>
                    <a href="#snapshot" target="_blank" rel="noopener noreferrer">
                      Snapshot Voting
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <div className="modal-overlay" onClick={() => setShowCreateProposal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Proposal</h3>

            <form onSubmit={handleCreateProposal}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={proposalForm.title}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Proposal title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  value={proposalForm.description}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detailed proposal description"
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Proposal Type</label>
                <select
                  value={proposalForm.proposalType}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      proposalType: e.target.value,
                    })
                  }
                >
                  <option value="PARAMETER_CHANGE">Parameter Change</option>
                  <option value="TREASURY_ALLOCATION">Treasury Allocation</option>
                  <option value="FEATURE_UPDATE">Feature Update</option>
                  <option value="EMERGENCY_ACTION">Emergency Action</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Budget (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={proposalForm.targetBudget}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      targetBudget: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Create Proposal
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateProposal(false)}
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

export default DAODashboard;
