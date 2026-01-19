/**
 * notificationService.js
 * Service for managing user notifications
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const redis = require('redis');
const redisClient = redis.createClient();
const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        // Setup email transporter
        this.emailTransporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    /**
     * Create notification
     */
    async createNotification(userId, data) {
        try {
            const {
                type,
                title,
                message,
                relatedId,
                relatedType,
                actionUrl,
                sendEmail = true,
            } = data;

            const notification = new Notification({
                userId,
                type, // bid, sale, offer, follow, comment, listing
                title,
                message,
                relatedId,
                relatedType,
                actionUrl,
                read: false,
                createdAt: new Date(),
            });

            await notification.save();

            // Invalidate cache
            await redisClient.del(`notifications:${userId}`);
            await redisClient.del(`notifications:unread:${userId}`);

            // Send email if enabled
            if (sendEmail) {
                await this.sendEmailNotification(userId, notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(userId, notification) {
        try {
            const user = await User.findById(userId).select('email username');
            if (!user || !user.email) {
                return; // User doesn't have email
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@durchex.com',
                to: user.email,
                subject: notification.title,
                html: `
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${
                        notification.actionUrl
                            ? `<a href="${notification.actionUrl}" style="background: #667eea; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">View</a>`
                            : ''
                    }
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        You received this because you have notifications enabled in your Durchex account.
                    </p>
                `,
            };

            await this.emailTransporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email notification:', error);
        }
    }

    /**
     * Get user notifications with pagination
     */
    async getNotifications(userId, limit = 20, skip = 0, options = {}) {
        try {
            // Try cache first
            const cacheKey = `notifications:${userId}:${skip}:${limit}`;
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            // Build query
            let query = { userId };
            if (options.type) {
                query.type = options.type;
            }
            if (options.read !== undefined) {
                query.read = options.read;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();

            const total = await Notification.countDocuments(query);

            const result = {
                notifications,
                total,
                page: Math.ceil(skip / limit) + 1,
                pages: Math.ceil(total / limit),
            };

            // Cache for 5 minutes
            await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

            return result;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        try {
            // Try cache first
            const cached = await redisClient.get(`notifications:unread:${userId}`);
            if (cached) {
                return parseInt(cached);
            }

            const count = await Notification.countDocuments({
                userId,
                read: false,
            });

            // Cache for 5 minutes
            await redisClient.setEx(
                `notifications:unread:${userId}`,
                300,
                count.toString()
            );

            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true, readAt: new Date() },
                { new: true }
            );

            // Invalidate cache for this user
            if (notification) {
                await redisClient.del(`notifications:${notification.userId}`);
                await redisClient.del(
                    `notifications:unread:${notification.userId}`
                );
            }

            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, read: false },
                { read: true, readAt: new Date() }
            );

            // Invalidate cache
            await redisClient.del(`notifications:${userId}`);
            await redisClient.del(`notifications:unread:${userId}`);

            return result.modifiedCount;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            const notification = await Notification.findByIdAndDelete(
                notificationId
            );

            // Invalidate cache
            if (notification) {
                await redisClient.del(`notifications:${notification.userId}`);
                await redisClient.del(
                    `notifications:unread:${notification.userId}`
                );
            }

            return !!notification;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications(userId) {
        try {
            const result = await Notification.deleteMany({ userId });

            // Invalidate cache
            await redisClient.del(`notifications:${userId}`);
            await redisClient.del(`notifications:unread:${userId}`);

            return result.deletedCount;
        } catch (error) {
            console.error('Error clearing notifications:', error);
            throw error;
        }
    }

    /**
     * Get notification by ID
     */
    async getNotificationById(notificationId) {
        try {
            return await Notification.findById(notificationId).lean();
        } catch (error) {
            console.error('Error fetching notification:', error);
            throw error;
        }
    }

    /**
     * Notify about auction bid
     */
    async notifyAuctionBid(auctionId, bidderId, currentBid, seller) {
        try {
            return await this.createNotification(seller, {
                type: 'bid',
                title: 'New Bid on Your Auction',
                message: `Someone bid ${currentBid} ETH on your auction`,
                relatedId: auctionId,
                relatedType: 'auction',
                actionUrl: `/auction/${auctionId}`,
            });
        } catch (error) {
            console.error('Error notifying auction bid:', error);
        }
    }

    /**
     * Notify about NFT sale
     */
    async notifyNFTSale(nftId, seller, buyer, price) {
        try {
            return await this.createNotification(seller, {
                type: 'sale',
                title: 'Your NFT Sold!',
                message: `Your NFT sold for ${price} ETH to ${buyer}`,
                relatedId: nftId,
                relatedType: 'nft',
                actionUrl: `/nft/${nftId}`,
            });
        } catch (error) {
            console.error('Error notifying sale:', error);
        }
    }

    /**
     * Notify about offer received
     */
    async notifyOfferReceived(offerId, seller, buyer, amount) {
        try {
            return await this.createNotification(seller, {
                type: 'offer',
                title: 'You Received an Offer',
                message: `${buyer} offered ${amount} ETH for your NFT`,
                relatedId: offerId,
                relatedType: 'offer',
                actionUrl: `/offers/${offerId}`,
            });
        } catch (error) {
            console.error('Error notifying offer:', error);
        }
    }

    /**
     * Notify about new follower
     */
    async notifyNewFollower(userId, followerName) {
        try {
            return await this.createNotification(userId, {
                type: 'follow',
                title: 'New Follower',
                message: `${followerName} started following you`,
                sendEmail: false, // Optional for social notifications
            });
        } catch (error) {
            console.error('Error notifying follower:', error);
        }
    }

    /**
     * Export notifications as CSV
     */
    async exportNotificationsCSV(userId) {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .lean();

            let csv = 'Date,Type,Title,Message,Status\n';

            for (const notif of notifications) {
                const status = notif.read ? 'Read' : 'Unread';
                csv += `"${new Date(notif.createdAt).toLocaleDateString()}","${notif.type}","${notif.title}","${notif.message}","${status}"\n`;
            }

            return csv;
        } catch (error) {
            console.error('Error exporting notifications:', error);
            throw error;
        }
    }

    /**
     * Get notification stats
     */
    async getNotificationStats(userId) {
        try {
            const total = await Notification.countDocuments({ userId });
            const unread = await Notification.countDocuments({
                userId,
                read: false,
            });

            // Count by type
            const byType = await Notification.aggregate([
                { $match: { userId } },
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]);

            return {
                total,
                unread,
                read: total - unread,
                byType: Object.fromEntries(
                    byType.map((t) => [t._id, t.count])
                ),
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
