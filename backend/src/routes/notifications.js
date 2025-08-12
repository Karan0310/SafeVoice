// backend/src/routes/notifications.js
const express = require('express');
const NotificationService = require('../services/notificationService');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/api/users/notifications', authenticateUser, async (req, res) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user.id);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    res.json({
      notifications: notifications.map(n => ({
        ...n,
        timeAgo: getTimeAgo(n.createdAt)
      })),
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/api/users/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;