import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiTrash2, FiEdit, FiShield, FiEye, FiX } from 'react-icons/fi';
import { adminAuthAPI } from '../../services/adminAuthAPI';
import { useAdmin } from '../../Context/AdminContext';
import toast from 'react-hot-toast';

const PartnerManagement = () => {
  const { isAdmin } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'partner'
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchAdmins();
    }
  }, [isAdmin]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await adminAuthAPI.getAllAdmins();
      setAdmins(response.admins || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      await adminAuthAPI.createPartner(formData.email, formData.username, formData.password);
      toast.success('Partner account created successfully');
      setShowCreateModal(false);
      setFormData({ email: '', username: '', password: '', role: 'partner' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to create partner');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      username: admin.username,
      password: '',
      role: admin.role
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        email: formData.email,
        username: formData.username,
        role: formData.role
      };
      if (formData.password) {
        updates.password = formData.password;
      }
      await adminAuthAPI.updateAdmin(editingAdmin._id, updates);
      toast.success('Account updated successfully');
      setShowEditModal(false);
      setEditingAdmin(null);
      setFormData({ email: '', username: '', password: '', role: 'partner' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to update account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await adminAuthAPI.deleteAdmin(id);
      toast.success('Account deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (!isAdmin()) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 font-display">Only administrators can manage partner accounts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const partners = admins.filter(a => a.role === 'partner');
  const adminAccounts = admins.filter(a => a.role === 'admin');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Partner & Admin Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiUserPlus className="w-5 h-5" />
          <span className="font-display">Create Partner</span>
        </button>
      </div>

      {/* Partners Section */}
      <div className="mb-8">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Partner Accounts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">{admin.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-display font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Partner
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">{formatDate(admin.lastLogin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">{formatDate(admin.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-display">
                    No partner accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Accounts Section */}
      <div>
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Admin Accounts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminAccounts.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">{admin.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-display font-semibold rounded-full bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">{formatDate(admin.lastLogin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">{formatDate(admin.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-gray-900">Create Partner Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1 font-display">Minimum 6 characters</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-display"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-gray-900">Edit Account</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1 font-display">Minimum 6 characters (optional)</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-display"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerManagement;

