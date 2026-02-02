/**
 * Notifications API (ESM) – wallet-based auth
 * In-memory store per wallet; replace with DB + notificationService when ready.
 */
import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

const store = new Map();

function getKey(wallet) {
  return (wallet || '').toLowerCase();
}

function getNotifications(wallet) {
  const key = getKey(wallet);
  if (!store.has(key)) {
    const list = [
      { id: 'welcome-1', type: 'info', title: 'Welcome to Durchex', body: 'You’ll get updates here for sales, offers, and bids.', read: false, createdAt: new Date().toISOString() },
    ];
    store.set(key, list);
  }
  return store.get(key);
}

router.get('/', auth, (req, res) => {
  try {
    const wallet = req.user?.address;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = parseInt(req.query.skip, 10) || 0;
    const type = req.query.type;

    let list = getNotifications(wallet);
    if (type) list = list.filter((n) => n.type === type);
    const total = list.length;
    const notifications = list.slice(skip, skip + limit);

    res.json({
      success: true,
      data: { notifications, total },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/unread', auth, (req, res) => {
  try {
    const wallet = req.user?.address;
    const list = getNotifications(wallet).filter((n) => !n.read);
    res.json({ success: true, data: { count: list.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:notificationId/read', auth, (req, res) => {
  try {
    const wallet = req.user?.address;
    const { notificationId } = req.params;
    const list = getNotifications(wallet);
    const n = list.find((x) => x.id === notificationId);
    if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });
    n.read = true;
    res.json({ success: true, data: n, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/read-all', auth, (req, res) => {
  try {
    const wallet = req.user?.address;
    const list = getNotifications(wallet);
    let count = 0;
    list.forEach((n) => {
      if (!n.read) { n.read = true; count += 1; }
    });
    res.json({ success: true, data: { markedCount: count }, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:notificationId', auth, (req, res) => {
  try {
    const wallet = req.user?.address;
    const { notificationId } = req.params;
    const list = getNotifications(wallet);
    const idx = list.findIndex((x) => x.id === notificationId);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Notification not found' });
    list.splice(idx, 1);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
