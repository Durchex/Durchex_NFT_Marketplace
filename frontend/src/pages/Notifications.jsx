import React, { useState, useEffect, useContext } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Notifications - List and manage user notifications (live API + same layout)
 */
const Notifications = () => {
  const { address, connectWallet } = useContext(ICOContent) || {};
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchList = () => {
    if (!address) return;
    setLoading(true);
    notificationsAPI
      .getList(address, { limit: 50, skip: 0 })
      .then((data) => {
        const notifications = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
        setList(notifications);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  const fetchUnread = () => {
    if (!address) return;
    notificationsAPI.getUnreadCount(address).then((c) => setUnreadCount(Number(c) || 0)).catch(() => setUnreadCount(0));
  };

  useEffect(() => {
    if (!address) {
      setList([]);
      setUnreadCount(0);
      return;
    }
    fetchList();
    fetchUnread();
  }, [address]);

  const handleMarkRead = async (id) => {
    if (!address) return;
    setActionId(id);
    try {
      await notificationsAPI.markAsRead(address, id);
      toast.success('Marked as read');
      fetchList();
      fetchUnread();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!address) return;
    setActionId('all');
    try {
      await notificationsAPI.markAllAsRead(address);
      toast.success('All marked as read');
      fetchList();
      fetchUnread();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!address) return;
    setActionId(id);
    try {
      await notificationsAPI.deleteOne(address, id);
      toast.success('Notification deleted');
      setList((prev) => prev.filter((n) => n.id !== id));
      fetchUnread();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-400">Sales, bids, offers, and activity updates</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {!address ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <Bell className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400 mb-4">Connect your wallet to see notifications.</p>
              <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={actionId === 'all'}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCheck size={18} />
                    Mark all as read
                  </button>
                )}
                <span className="text-gray-400 text-sm">{unreadCount} unread</span>
              </div>

              {loading ? (
                <p className="text-gray-400">Loading notifications…</p>
              ) : list.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center text-gray-400">
                  <Bell className="mx-auto mb-3 text-gray-600" size={40} />
                  <p>No notifications yet.</p>
                  <p className="text-sm mt-1">You’ll see sales, offers, and bids here.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {list.map((n) => (
                    <li
                      key={n.id}
                      className={`bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-start justify-between gap-4 ${
                        !n.read ? 'border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{n.title ?? n.message ?? n.type ?? 'Notification'}</p>
                        {n.body && <p className="text-gray-400 text-sm mt-1">{n.body}</p>}
                        <p className="text-gray-500 text-xs mt-2">{formatDate(n.createdAt ?? n.date ?? n.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            disabled={actionId === n.id}
                            className="p-2 text-green-400 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                            title="Mark as read"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          disabled={actionId === n.id}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Notifications;
