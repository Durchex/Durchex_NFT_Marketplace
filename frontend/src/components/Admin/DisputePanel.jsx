import React, { useState, useEffect } from 'react';

const DisputePanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'open',
    priority: '',
  });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setDisputes(data.disputes);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (decision, reason) => {
    setResolving(true);
    try {
      const response = await fetch(
        `/api/admin/disputes/${selectedDispute._id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ decision, reason }),
        }
      );

      if (!response.ok) throw new Error('Failed to resolve dispute');
      alert('Dispute resolved successfully!');
      fetchDisputes();
      setSelectedDispute(null);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setResolving(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
    };
    return colors[priority] || '#999';
  };

  return (
    <div className="dispute-panel">
      <div className="dispute-filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="filter-select"
        >
          <option value="">All Disputes</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading ? (
        <div>Loading disputes...</div>
      ) : (
        <div className="disputes-list">
          {disputes.map((dispute) => (
            <div key={dispute._id} className="dispute-card">
              <div className="dispute-header">
                <h4>Dispute #{dispute._id.slice(-6)}</h4>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(dispute.priority) }}
                >
                  {dispute.priority}
                </span>
              </div>

              <div className="dispute-details">
                <p>
                  <strong>Reporter:</strong> {dispute.reporterId?.username || 'Unknown'}
                </p>
                <p>
                  <strong>Respondent:</strong> {dispute.respondentId?.username || 'Unknown'}
                </p>
                <p>
                  <strong>Type:</strong> {dispute.type}
                </p>
                <p>
                  <strong>Amount:</strong> {dispute.amount} ETH
                </p>
                <p>
                  <strong>Description:</strong> {dispute.description}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(dispute.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedDispute(dispute)}
                className="resolve-button"
              >
                Review & Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedDispute && (
        <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Resolve Dispute</h3>

            <div className="dispute-review">
              <div className="review-section">
                <h4>Dispute Details</h4>
                <p>
                  <strong>ID:</strong> {selectedDispute._id}
                </p>
                <p>
                  <strong>Type:</strong> {selectedDispute.type}
                </p>
                <p>
                  <strong>Description:</strong> {selectedDispute.description}
                </p>
              </div>

              <div className="decision-form">
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="dismiss"
                    onChange={() => {}}
                  />
                  Dismiss (no action)
                </label>

                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="compensation"
                    onChange={() => {}}
                  />
                  Award Compensation
                </label>

                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="action"
                    onChange={() => {}}
                  />
                  Take Action on Respondent
                </label>

                <textarea
                  placeholder="Enter resolution reason..."
                  className="reason-input"
                />

                <div className="button-group">
                  <button
                    onClick={() =>
                      handleResolveDispute(
                        'dismiss',
                        document.querySelector('.reason-input').value
                      )
                    }
                    disabled={resolving}
                    className="btn-dismiss"
                  >
                    {resolving ? 'Resolving...' : 'Dismiss'}
                  </button>

                  <button
                    onClick={() =>
                      handleResolveDispute(
                        'compensation',
                        document.querySelector('.reason-input').value
                      )
                    }
                    disabled={resolving}
                    className="btn-compensate"
                  >
                    {resolving ? 'Resolving...' : 'Compensate'}
                  </button>

                  <button
                    onClick={() =>
                      handleResolveDispute(
                        'action',
                        document.querySelector('.reason-input').value
                      )
                    }
                    disabled={resolving}
                    className="btn-action"
                  >
                    {resolving ? 'Resolving...' : 'Take Action'}
                  </button>

                  <button
                    onClick={() => setSelectedDispute(null)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputePanel;
