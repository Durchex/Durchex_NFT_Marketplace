/**
 * notification.js
 * API routes for notification management
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');

/**
 * GET /notification
 * Get user's notifications with pagination
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = parseInt(req.query.skip) || 0;
        const type = req.query.type; // Optional: filter by type

        const result = await notificationService.getNotifications(
            userId,
            limit,
            skip,
            { type }
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message,
        });
    }
});

/**
 * GET /notification/unread
 * Get unread notification count
 */
router.get('/unread', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await notificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread count',
            error: error.message,
        });
    }
});

/**
 * GET /notification/stats
 * Get notification statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await notificationService.getNotificationStats(userId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notification stats',
            error: error.message,
        });
    }
});

/**
 * GET /notification/:notificationId
 * Get specific notification
 */
router.get('/:notificationId', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification =
            await notificationService.getNotificationById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        // Verify ownership
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        res.json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification',
            error: error.message,
        });
    }
});

/**
 * PUT /notification/:notificationId/read
 * Mark notification as read
 */
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification =
            await notificationService.markAsRead(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.json({
            success: true,
            data: notification,
            message: 'Marked as read',
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read',
            error: error.message,
        });
    }
});

/**
 * PUT /notification/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await notificationService.markAllAsRead(userId);

        res.json({
            success: true,
            data: { markedCount: count },
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all as read',
            error: error.message,
        });
    }
});

/**
 * DELETE /notification/:notificationId
 * Delete notification
 */
router.delete('/:notificationId', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const deleted =
            await notificationService.deleteNotification(notificationId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message,
        });
    }
});

/**
 * DELETE /notification/clear-all
 * Clear all notifications
 */
router.delete('/clear-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await notificationService.clearAllNotifications(userId);

        res.json({
            success: true,
            data: { deletedCount: count },
            message: 'All notifications cleared',
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing notifications',
            error: error.message,
        });
    }
});

/**
 * GET /notification/export
 * Export notifications as CSV
 */
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const csv = await notificationService.exportNotificationsCSV(userId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=notifications.csv'
        );
        res.send(csv);
    } catch (error) {
        console.error('Error exporting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting notifications',
            error: error.message,
        });
    }
});

module.exports = router;
