import React from 'react';

const PlatformStats = ({ stats, onRefresh }) => {
  const StatCard = ({ title, value, subtitle, color }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <h4>{title}</h4>
      <div className="stat-value">{value}</div>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
  );

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div className="platform-stats">
      <div className="stats-header">
        <h2>Platform Overview</h2>
        <button onClick={onRefresh} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stats-section">
          <h3>Users</h3>
          <div className="stat-cards">
            <StatCard
              title="Total Users"
              value={stats.users.total}
              color="#667eea"
            />
            <StatCard
              title="Active Users"
              value={stats.users.active}
              color="#4caf50"
            />
            <StatCard
              title="Verified"
              value={stats.users.verified}
              color="#2196f3"
            />
            <StatCard
              title="Suspended"
              value={stats.users.suspended}
              color="#ff9800"
            />
            <StatCard
              title="Banned"
              value={stats.users.banned}
              color="#f44336"
            />
          </div>
        </div>

        <div className="stats-section">
          <h3>NFTs</h3>
          <div className="stat-cards">
            <StatCard
              title="Total NFTs"
              value={stats.nfts.total}
              color="#667eea"
            />
            <StatCard
              title="Listed"
              value={stats.nfts.listed}
              color="#4caf50"
            />
            <StatCard
              title="Sold"
              value={stats.nfts.sold}
              color="#2196f3"
            />
            <StatCard
              title="Flagged"
              value={stats.nfts.flagged}
              color="#f44336"
            />
          </div>
        </div>

        <div className="stats-section">
          <h3>Disputes & Transactions</h3>
          <div className="stat-cards">
            <StatCard
              title="Open Disputes"
              value={stats.disputes.open}
              color="#ff9800"
            />
            <StatCard
              title="Resolved Disputes"
              value={stats.disputes.resolved}
              color="#4caf50"
            />
            <StatCard
              title="Total Transactions"
              value={stats.transactions.total}
              color="#667eea"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.transactions.pendingApprovals}
              color="#ff9800"
            />
          </div>
        </div>

        <div className="stats-section">
          <h3>Volume</h3>
          <div className="stat-cards">
            <StatCard
              title="Trading Volume"
              value={`${(stats.transactions.volume / 1e18).toFixed(2)} ETH`}
              color="#4caf50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStats;
