import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    isVerified: '',
    search: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action, reason = '') => {
    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);
      alert(`User ${action} successfully!`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      active: 'badge-success',
      suspended: 'badge-warning',
      banned: 'badge-danger',
      inactive: 'badge-gray',
    };
    return <span className={`badge ${statusClass[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="user-management">
      <div className="management-filters">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value, page: 1 })
          }
          className="search-input"
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.isVerified}
          onChange={(e) => setFilters({ ...filters, isVerified: e.target.value, page: 1 })}
          className="filter-select"
        >
          <option value="">All Users</option>
          <option value="true">Verified Only</option>
          <option value="false">Unverified Only</option>
        </select>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{user.isVerified ? '✓' : '✗'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="action-button"
                      onClick={() => setSelectedUser(user)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Manage User: {selectedUser.username}</h3>

            <div className="user-info">
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Wallet:</strong> {selectedUser.walletAddress}
              </p>
              <p>
                <strong>Status:</strong> {getStatusBadge(selectedUser.status)}
              </p>
              <p>
                <strong>Verified:</strong> {selectedUser.isVerified ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="action-buttons">
              {selectedUser.status === 'active' && !selectedUser.isVerified && (
                <button
                  onClick={() => handleAction(selectedUser._id, 'verify')}
                  disabled={actionInProgress}
                  className="btn-verify"
                >
                  Verify User
                </button>
              )}

              {selectedUser.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter suspension reason:');
                      if (reason) handleAction(selectedUser._id, 'suspend', reason);
                    }}
                    disabled={actionInProgress}
                    className="btn-suspend"
                  >
                    Suspend
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Enter ban reason:');
                      if (reason) handleAction(selectedUser._id, 'ban', reason);
                    }}
                    disabled={actionInProgress}
                    className="btn-ban"
                  >
                    Ban
                  </button>
                </>
              )}

              <button
                onClick={() => handleAction(selectedUser._id, 'reset-password')}
                disabled={actionInProgress}
                className="btn-reset"
              >
                Reset Password
              </button>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="btn-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
